import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { bobConfigs, bobConversations } from "@db/schema";
import { eq } from "drizzle-orm";
import { classifyMessage, transcribeTelegramAudio, generateConfirmationMessage, generateClarificationQuestion } from "./bob-brain";
import { insertTaskRow, insertPersonalTaskRow, insertScheduleRow, readTasks, extractSheetId } from "./bob-sheets";
import { sendTelegramMessage, sendTelegramInlineKeyboard, getTelegramFileUrl, setTelegramWebhook } from "./telegram-bot";

// ─── Webhook do Telegram ───
export const bobRouter = createRouter({
  // Endpoint que recebe webhooks do Telegram
  webhook: publicQuery
    .input(z.record(z.string(), z.any()))
    .mutation(async ({ input }) => {
      const update = input as TelegramUpdate;

      if (update.message) {
        await handleMessage(update.message);
      }

      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      }

      return { ok: true };
    }),

  // Configurar webhook do bot
  setWebhook: publicQuery
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const ok = await setTelegramWebhook(input.url);
      return { ok };
    }),

  // Vincular conta do usuario ao Telegram
  linkAccount: publicQuery
    .input(z.object({ userId: z.number(), telegramChatId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .insert(bobConfigs)
        .values({
          userId: input.userId,
          telegramChatId: input.telegramChatId,
        })
        .onDuplicateKeyUpdate({
          set: { telegramChatId: input.telegramChatId, updatedAt: new Date() },
        });

      return { ok: true };
    }),

  // Configurar planilhas do usuario
  setSheets: publicQuery
    .input(
      z.object({
        telegramChatId: z.string(),
        workSheetUrl: z.string().optional(),
        personalSheetUrl: z.string().optional(),
        scheduleSheetUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const config = await db.query.bobConfigs.findFirst({
        where: eq(bobConfigs.telegramChatId, input.telegramChatId),
      });

      if (!config) {
        return { error: "Config not found. Start with /start first." };
      }

      const updates: Record<string, any> = {};
      if (input.workSheetUrl) {
        updates.workSheetId = extractSheetId(input.workSheetUrl);
        updates.workSheetTab = "Follow up";
      }
      if (input.personalSheetUrl) {
        updates.personalSheetId = extractSheetId(input.personalSheetUrl);
        updates.personalSheetTab = "Pessoal";
      }
      if (input.scheduleSheetUrl) {
        updates.scheduleSheetId = extractSheetId(input.scheduleSheetUrl);
        updates.scheduleSheetTab = "Cronograma";
      }

      await db.update(bobConfigs).set(updates).where(eq(bobConfigs.id, config.id));
      return { ok: true };
    }),
});

// ─── Tipos do Telegram ───
interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; username?: string; first_name?: string };
  text?: string;
  voice?: { file_id: string; duration: number; mime_type?: string };
  audio?: { file_id: string; duration: number; mime_type?: string };
  date: number;
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: { chat: { id: number } };
  data: string;
}

/**
 * Processa um webhook do Telegram (chamado pelo boot.ts)
 */
export async function handleTelegramWebhook(body: Record<string, any>): Promise<void> {
  const update = body as TelegramUpdate;

  if (update.message) {
    await handleMessage(update.message);
  }

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

// ─── Handler principal de mensagens ───
async function handleMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  const chatIdStr = String(chatId);
  const text = msg.text?.trim() ?? "";

  // Verifica se é audio
  const isAudio = !!msg.voice || !!msg.audio;
  let messageText = text;

  try {
    // 1. Se for audio, transcreve
    if (isAudio && (msg.voice || msg.audio)) {
      await sendTelegramMessage(chatId, "🎵 Transcrevendo audio...");
      const fileUrl = await getTelegramFileUrl((msg.voice || msg.audio)!.file_id);
      messageText = await transcribeTelegramAudio(fileUrl);
      console.log(`[Bob] Audio transcrito: "${messageText}"`);
    }

    // 2. Comandos do bot
    if (messageText.startsWith("/")) {
      await handleCommand(chatId, messageText, msg);
      return;
    }

    // 3. Busca config do usuario
    const db = getDb();
    const config = await db.query.bobConfigs.findFirst({
      where: eq(bobConfigs.telegramChatId, chatIdStr),
    });

    if (!config) {
      await sendTelegramMessage(
        chatId,
        "Oi! Eu sou o Bob, seu assistente de producao.\n\n" +
          "Para comecar, use o comando /start no dashboard do CineFlux e vincule sua conta do Telegram.\n\n" +
          "Ou digite /configurar para configurar manualmente.",
      );
      return;
    }

    // 4. Verifica estado de conversa
    const conversation = await db.query.bobConversations.findFirst({
      where: eq(bobConversations.telegramChatId, chatIdStr),
    });

    if (conversation && conversation.state !== "idle") {
      await handleConversationState(chatId, messageText, config, conversation);
      return;
    }

    // 5. Classifica a mensagem com GPT-4o
    const jobAtual = (conversation?.context as any)?.jobAtual ?? null;
    const classification = await classifyMessage(messageText, jobAtual, isAudio);

    // 6. Executa a acao
    await executeAction(chatId, classification, config, messageText);
  } catch (error) {
    console.error("[Bob] Error handling message:", error);
    await sendTelegramMessage(
      chatId,
      "Ops, algo deu errado. Tenta de novo ou digite /ajuda.",
    );
  }
}

// ─── Handler de comandos ───
async function handleCommand(chatId: number, text: string, msg: TelegramMessage): Promise<void> {
  const db = getDb();
  const chatIdStr = String(chatId);
  const command = text.split(" ")[0].toLowerCase();

  switch (command) {
    case "/start":
      await sendTelegramMessage(
        chatId,
        "🎬 Oi! Eu sou o Bob, seu assistente de producao.\n\n" +
          "O que eu faco:\n" +
          "✅ Registro tarefas na sua planilha\n" +
          "✅ Crio eventos no seu calendario\n" +
          "✅ Transcrevo audios\n" +
          "✅ Consulto suas pendencias\n\n" +
          "Comandos:\n" +
          "/configurar - Configurar planilhas\n" +
          "/tarefas - Ver tarefas do dia\n" +
          "/pendencias - Ver pendencias\n" +
          "/ajuda - Ajuda\n\n" +
          "Me manda uma mensagem com uma tarefa que eu registro pra voce!",
      );

      // Cria/atualiza config basica
      const existing = await db.query.bobConfigs.findFirst({
        where: eq(bobConfigs.telegramChatId, chatIdStr),
      });

      if (!existing && msg.from) {
        // Procura por usuario com esse telegramUsername
        // Se nao achar, cria config sem userId (usuario vincula depois)
        await db.insert(bobConfigs).values({
          telegramChatId: chatIdStr,
          telegramUsername: msg.from.username ?? msg.from.first_name,
          userId: 0, // placeholder, sera vinculado depois
        });
      }
      break;

    case "/configurar":
      await sendTelegramMessage(
        chatId,
        "Configuracao do Bob:\n\n" +
          "Para configurar suas planilhas, me envie:\n\n" +
          "1. Link da planilha de trabalho:\n" +
          "   /planilha TRABALHO [link]\n\n" +
          "2. Link da planilha pessoal:\n" +
          "   /planilha PESSOAL [link]\n\n" +
          "3. Link da planilha de cronograma:\n" +
          "   /planilha CRONOGRAMA [link]\n\n" +
          "Exemplo:\n" +
          "/planilha TRABALHO https://docs.google.com/spreadsheets/d/ABC123/edit",
      );
      break;

    case "/planilha": {
      const parts = text.split(" ");
      const tipo = parts[1]?.toUpperCase();
      const link = parts[2];

      if (!tipo || !link) {
        await sendTelegramMessage(chatId, "Formato: /planilha TRABALHO [link]");
        return;
      }

      const config = await db.query.bobConfigs.findFirst({
        where: eq(bobConfigs.telegramChatId, chatIdStr),
      });

      if (!config) {
        await sendTelegramMessage(chatId, "Use /start primeiro.");
        return;
      }

      const sheetId = extractSheetId(link);
      const updates: Record<string, any> = {};

      if (tipo === "TRABALHO") {
        updates.workSheetId = sheetId;
        updates.workSheetTab = "Follow up";
      } else if (tipo === "PESSOAL") {
        updates.personalSheetId = sheetId;
        updates.personalSheetTab = "Pessoal";
      } else if (tipo === "CRONOGRAMA") {
        updates.scheduleSheetId = sheetId;
        updates.scheduleSheetTab = "Cronograma";
      } else {
        await sendTelegramMessage(chatId, "Tipo invalido. Use: TRABALHO, PESSOAL ou CRONOGRAMA");
        return;
      }

      await db.update(bobConfigs).set(updates).where(eq(bobConfigs.id, config.id));
      await sendTelegramMessage(chatId, `✅ Planilha de ${tipo} configurada!`);
      break;
    }

    case "/tarefas":
    case "/pendencias": {
      const config = await db.query.bobConfigs.findFirst({
        where: eq(bobConfigs.telegramChatId, chatIdStr),
      });

      if (!config?.workSheetId || !config.googleAccessToken) {
        await sendTelegramMessage(
          chatId,
          "Planilha nao configurada ou Google nao conectado.\n" +
            "Use /configurar e depois conecte sua conta Google no dashboard.",
        );
        return;
      }

      try {
        const tasks = await readTasks(
          config.googleAccessToken,
          config.workSheetId,
          config.workSheetTab ?? "Follow up",
          30,
        );

        if (tasks.length <= 1) {
          await sendTelegramMessage(chatId, "Nenhuma tarefa encontrada na planilha.");
          return;
        }

        // Filtra tarefas nao concluidas (exclui header)
        const pending = tasks.slice(1).filter((row) => {
          const status = (row[3] ?? "").toLowerCase().trim();
          return status !== "concluido" && status !== "done" && status !== "ok";
        });

        if (pending.length === 0) {
          await sendTelegramMessage(chatId, "🎉 Nenhuma pendencia! Todas as tarefas estao concluidas.");
          return;
        }

        let msg = `📋 Pendencias de trabalho (${pending.length}):\n\n`;
        pending.slice(0, 15).forEach((row, i) => {
          const job = row[0] ?? "";
          const resumo = row[1] ?? "";
          const depto = row[4] ?? "";
          const prazo = row[5] ?? "";
          msg += `${i + 1}. ${resumo}${job ? ` [${job}]` : ""}${depto ? ` | ${depto}` : ""}${prazo ? ` | ${prazo}` : ""}\n`;
        });

        if (pending.length > 15) {
          msg += `\n...e mais ${pending.length - 15} tarefas.`;
        }

        await sendTelegramMessage(chatId, msg);
      } catch (error) {
        console.error("[Bob] Error reading tasks:", error);
        await sendTelegramMessage(chatId, "Erro ao ler planilha. Verifique se a planilha esta compartilhada e se o Google esta conectado.");
      }
      break;
    }

    case "/ajuda":
      await sendTelegramMessage(
        chatId,
        "🎬 Bob — Comandos disponiveis:\n\n" +
          "/start — Iniciar\n" +
          "/configurar — Configurar planilhas\n" +
          "/planilha TIPO LINK — Salvar planilha\n" +
          "/tarefas — Ver pendencias\n" +
          "/pendencias — Ver pendencias\n" +
          "/ajuda — Este menu\n\n" +
          "Exemplos de mensagens que entendo:\n" +
          "• shooting board do Habibs pra amanha\n" +
          "• cobrar figurino do Nike, hoje\n" +
          "• agenda reuniao sexta 14h\n" +
          "• tarefa pessoal: marcar dentista\n" +
          "• cronograma: filmagem Assai 15/05 no estudio",
      );
      break;

    default:
      await sendTelegramMessage(chatId, `Comando desconhecido: ${command}\nDigite /ajuda para ver os comandos.`);
  }
}

// ─── Handler de estados de conversa ───
async function handleConversationState(
  chatId: number,
  text: string,
  config: any,
  conversation: any,
): Promise<void> {
  const db = getDb();
  const chatIdStr = String(chatId);
  const ctx = (conversation.context as Record<string, any>) ?? {};
  const state = conversation.state;

  switch (state) {
    case "awaiting_job": {
      // Usuario respondeu com o nome do job
      const jobName = text.trim();
      const classification = ctx.pendingClassification as any;
      if (classification) {
        classification.job = jobName;
        classification.precisa_job = false;
        await executeAction(chatId, classification, config, "");
      }
      await db
        .update(bobConversations)
        .set({ state: "idle", context: {} })
        .where(eq(bobConversations.telegramChatId, chatIdStr));
      break;
    }

    case "awaiting_meet": {
      const lower = text.toLowerCase().trim();
      if (lower === "sim" || lower === "yes" || lower === "s" || lower === "quero") {
        // Adiciona meet ao evento
        const evento = ctx.pendingEvent as any;
        if (evento) {
          evento.meet = true;
          // Cria evento com meet
          await createCalendarEvent(chatId, evento, config, true);
        }
      } else {
        await sendTelegramMessage(chatId, "Evento criado sem link de reuniao.");
      }
      await db
        .update(bobConversations)
        .set({ state: "idle", context: {} })
        .where(eq(bobConversations.telegramChatId, chatIdStr));
      break;
    }

    default:
      // Volta para idle
      await db
        .update(bobConversations)
        .set({ state: "idle", context: {} })
        .where(eq(bobConversations.telegramChatId, chatIdStr));
      // Reprocessa a mensagem normalmente
      await handleMessage({ message_id: 0, chat: { id: chatId, type: "private" }, text, date: Date.now() });
  }
}

// ─── Executa a acao classificada ───
async function executeAction(
  chatId: number,
  classification: any,
  config: any,
  originalText: string,
): Promise<void> {
  const db = getDb();
  const chatIdStr = String(chatId);

  // Se precisa de job e nao tem
  if (classification.precisa_job && !classification.job) {
    const question = await generateClarificationQuestion("job", { message: originalText });
    await sendTelegramMessage(chatId, question);

    // Salva estado de conversa
    await db
      .insert(bobConversations)
      .values({
        telegramChatId: chatIdStr,
        state: "awaiting_job",
        context: { pendingClassification: classification },
      })
      .onDuplicateKeyUpdate({
        set: { state: "awaiting_job", context: { pendingClassification: classification }, lastMessageAt: new Date() },
      });
    return;
  }

  // Se ignorar
  if (classification.ignorar || classification.acao === "conversa") {
    return; // Nao responde nada em conversas casuais
  }

  switch (classification.acao) {
    case "tarefa": {
      await handleTaskAction(chatId, classification, config, originalText);
      break;
    }

    case "evento": {
      await handleEventAction(chatId, classification, config);
      break;
    }

    case "consulta": {
      await handleConsultaAction(chatId, classification, config);
      break;
    }

    case "config": {
      await sendTelegramMessage(chatId, "Configuracao recebida! Use /configurar para mais opcoes.");
      break;
    }

    default: {
      await sendTelegramMessage(chatId, "Nao entendi direito. Pode reformular?");
    }
  }
}

// ─── Handler de tarefas ───
async function handleTaskAction(chatId: number, classification: any, config: any, originalText?: string): Promise<void> {
  const isPersonal = originalTextContainsPersonalHint(originalText ?? classification.resumo_tarefa ?? "");

  // Verifica se tem planilha configurada
  const targetSheetId = isPersonal ? config.personalSheetId : config.workSheetId;
  const targetTab = isPersonal ? (config.personalSheetTab ?? "Pessoal") : (config.workSheetTab ?? "Follow up");

  if (!targetSheetId) {
    await sendTelegramMessage(
      chatId,
      isPersonal
        ? "Planilha pessoal nao configurada. Use /configurar."
        : "Planilha de trabalho nao configurada. Use /configurar.",
    );
    return;
  }

  if (!config.googleAccessToken) {
    await sendTelegramMessage(
      chatId,
      "Conta Google nao conectada.\nConecte no dashboard do CineFlux primeiro.",
    );
    return;
  }

  try {
    if (isPersonal) {
      await insertPersonalTaskRow(config.googleAccessToken, targetSheetId, targetTab, {
        data: classification.prazo ?? "",
        tarefa: classification.resumo_tarefa ?? "",
        status: "novo",
        categoria: "",
        notes: classification.notes ?? "",
      });
    } else {
      await insertTaskRow(config.googleAccessToken, targetSheetId, targetTab, {
        job: classification.job ?? "",
        resumo: classification.resumo_tarefa ?? "",
        tipo: classification.tipo ?? "tarefa",
        status: "novo",
        departamento: classification.departamento ?? "Outro",
        prazo: classification.prazo ?? "",
        responsavel: classification.responsavel ?? "",
        notes: classification.notes ?? "",
      });
    }

    const confirmation = await generateConfirmationMessage(classification);
    await sendTelegramMessage(chatId, confirmation);
  } catch (error) {
    console.error("[Bob] Error inserting task:", error);
    await sendTelegramMessage(chatId, "Erro ao salvar na planilha. Verifique as permissoes do Google Sheets.");
  }
}

// ─── Handler de eventos ───
async function handleEventAction(chatId: number, classification: any, config: any): Promise<void> {
  // Placeholder: evento no Google Calendar
  // Por enquanto confirma que recebeu e no futuro cria no Calendar

  let msg = `📅 Evento registrado!\n\n`;
  msg += `Titulo: ${classification.evento_titulo ?? ""}\n`;
  msg += `Data: ${classification.evento_data ?? ""}\n`;
  msg += `Horario: ${classification.evento_hora ?? ""}\n`;
  if (classification.evento_duracao) msg += `Duracao: ${classification.evento_duracao}\n`;

  await sendTelegramMessage(chatId, msg);

  // Se parece reuniao, pergunta sobre meet
  const isMeeting = /reuniao|call|kickoff|alinha|apresentacao|ppm/i.test(
    classification.evento_titulo ?? "",
  );

  if (isMeeting) {
    await sendTelegramInlineKeyboard(chatId, "Quer adicionar um link de Google Meet?", [
      [
        { text: "Sim", callback_data: "meet_yes" },
        { text: "Nao", callback_data: "meet_no" },
      ],
    ]);

    const db = getDb();
    await db
      .insert(bobConversations)
      .values({
        telegramChatId: String(chatId),
        state: "awaiting_meet",
        context: { pendingEvent: classification },
      })
      .onDuplicateKeyUpdate({
        set: {
          state: "awaiting_meet",
          context: { pendingEvent: classification },
          lastMessageAt: new Date(),
        },
      });
  }

  // Se tem cronograma configurado, insere la tambem
  if (config.scheduleSheetId && config.googleAccessToken) {
    try {
      await insertScheduleRow(config.googleAccessToken, config.scheduleSheetId, config.scheduleSheetTab ?? "Cronograma", {
        data: classification.evento_data ?? "",
        evento: classification.evento_titulo ?? "",
        local: "",
        horario: classification.evento_hora ?? "",
        responsavel: "",
        job: classification.job ?? "",
        notes: classification.notes ?? "",
      });
    } catch (e) {
      console.log("[Bob] Could not insert into schedule sheet:", e);
    }
  }
}

// ─── Handler de consultas ───
async function handleConsultaAction(chatId: number, classification: any, config: any): Promise<void> {
  const consultaTipo = classification.consulta_tipo;

  if (!config.workSheetId || !config.googleAccessToken) {
    await sendTelegramMessage(chatId, "Planilha nao configurada. Use /configurar.");
    return;
  }

  try {
    const tasks = await readTasks(
      config.googleAccessToken,
      config.workSheetId,
      config.workSheetTab ?? "Follow up",
      50,
    );

    if (tasks.length <= 1) {
      await sendTelegramMessage(chatId, "Nenhuma tarefa encontrada.");
      return;
    }

    const allTasks = tasks.slice(1); // Remove header

    switch (consultaTipo) {
      case "tarefas":
      case "pendencias": {
        const pending = allTasks.filter((row) => {
          const status = (row[3] ?? "").toLowerCase().trim();
          return status !== "concluido" && status !== "done" && status !== "ok";
        });

        if (pending.length === 0) {
          await sendTelegramMessage(chatId, "🎉 Nenhuma pendencia!");
          return;
        }

        let msg = `📋 ${consultaTipo === "tarefas" ? "Tarefas" : "Pendencias"} (${pending.length}):\n\n`;
        pending.slice(0, 15).forEach((row, i) => {
          const job = row[0] ?? "";
          const resumo = row[1] ?? "";
          const prazo = row[5] ?? "";
          msg += `${i + 1}. ${resumo}${job ? ` [${job}]` : ""}${prazo ? ` | ${prazo}` : ""}\n`;
        });

        if (pending.length > 15) msg += `\n...e mais ${pending.length - 15}.`;
        await sendTelegramMessage(chatId, msg);
        break;
      }

      case "tarefas_trabalho": {
        let msg = `💼 Tarefas de trabalho (${allTasks.length}):\n\n`;
        allTasks.slice(0, 20).forEach((row, i) => {
          const job = row[0] ?? "";
          const resumo = row[1] ?? "";
          const status = row[3] ?? "";
          msg += `${i + 1}. ${resumo}${job ? ` [${job}]` : ""} (${status})\n`;
        });
        await sendTelegramMessage(chatId, msg);
        break;
      }

      default: {
        await sendTelegramMessage(chatId, "Buscando suas informacoes...");
        const pending = allTasks.filter((row) => {
          const status = (row[3] ?? "").toLowerCase().trim();
          return status !== "concluido" && status !== "done";
        });
        await sendTelegramMessage(chatId, `Voce tem ${pending.length} pendencias de ${allTasks.length} tarefas totais.\nUse /tarefas para ver a lista completa.`);
      }
    }
  } catch (error) {
    console.error("[Bob] Error on consulta:", error);
    await sendTelegramMessage(chatId, "Erro ao buscar dados. Tente novamente.");
  }
}

// ─── Handler de callback queries (botoes inline) ───
async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const data = query.data;

  if (data === "meet_yes") {
    await sendTelegramMessage(chatId, "Criando evento com Google Meet... (funcionalidade em desenvolvimento)");
  } else if (data === "meet_no") {
    await sendTelegramMessage(chatId, "Evento criado sem link de reuniao.");
  }

  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: query.id }),
  });
}

// ─── Helpers ───

function originalTextContainsPersonalHint(text: string): boolean {
  const personalKeywords = [
    "pessoal", "dentista", "medico", "medica", "filho", "filha", "cachorro",
    "gato", "pet", "ração", "racao", "comprar", "casa", "banco", "cartao",
    "cartão", "escola", "faculdade", "namorado", "namorada", "esposa",
    "esposo", "marido", "familia", "família",
  ];
  const lower = text.toLowerCase();
  return personalKeywords.some((kw) => lower.includes(kw));
}

async function createCalendarEvent(
  _chatId: number,
  _evento: any,
  _config: any,
  _withMeet: boolean,
): Promise<void> {
  // Placeholder: implementacao do Google Calendar API
  // Por enquanto so confirma
  console.log("[Bob] Calendar event creation - placeholder");
}
