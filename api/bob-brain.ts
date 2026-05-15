import { chatCompletion, transcribeAudio } from "./lib/openai";

export interface BobClassification {
  ignorar: boolean;
  acao: "tarefa" | "evento" | "consulta" | "config" | "conversa";
  tipo?: "tarefa" | "decisao" | "aprovado";
  status?: string;
  job?: string;
  precisa_job?: boolean;
  resumo_tarefa?: string;
  departamento?: string;
  prazo?: string;
  responsavel?: string;
  notes?: string;
  evento_titulo?: string;
  evento_data?: string;
  evento_hora?: string;
  evento_duracao?: string;
  evento_convidados?: string[];
  evento_meet?: boolean;
  consulta_tipo?: "tarefas" | "pendencias" | "eventos_hoje" | "tarefas_trabalho" | "tarefas_pessoais";
  config_acao?: string;
  config_valor?: string;
  resposta_usuario?: string;
}

const SYSTEM_PROMPT_PUBLICIDADE = `Voce e um assistente de producao audiovisual especializado em pre-producao de filmes publicitarios.

Sua funcao e interpretar mensagens recebidas em linguagem natural (texto ou transcricao de audio) e classificar a intencao do usuario.

Voce sempre recebera duas informacoes:
- JOB_ATUAL: o job/campanha que o usuario esta trabalhando no momento
- MENSAGEM_USUARIO: a mensagem que o usuario enviou

Analise a mensagem e responda APENAS com JSON valido. NUNCA escreva texto fora do JSON.

REGRAS DE CLASSIFICACAO DE ACAO:

1. "tarefa" = registrar uma tarefa em planilha
2. "evento" = criar evento no calendario
3. "consulta" = usuario esta perguntando algo (tarefas, pendencias, agenda)
4. "config" = usuario esta configurando o Bob
5. "conversa" = conversa casual, nao requer acao

SE A MENSAGEM FOR CONSULTA:
- acao: "consulta"
- consulta_tipo: um de ["tarefas", "pendencias", "eventos_hoje", "tarefas_trabalho", "tarefas_pessoais"]

SE A MENSAGEM FOR CONFIGURACAO:
- acao: "config"
- config_acao: o que o usuario quer configurar
- config_valor: o valor da configuracao

SE A MENSAGEM FOR CONVERSA CASUAL:
- acao: "conversa"

SE A MENSAGEM FOR TAREFA, use este formato:

{
  "ignorar": false,
  "acao": "tarefa",
  "tipo": "tarefa",
  "status": "novo",
  "job": "",
  "precisa_job": false,
  "resumo_tarefa": "",
  "departamento": "",
  "prazo": "",
  "responsavel": "",
  "notes": ""
}

SE A MENSAGEM FOR EVENTO, use este formato:

{
  "ignorar": false,
  "acao": "evento",
  "evento_titulo": "",
  "evento_data": "",
  "evento_hora": "",
  "evento_duracao": "1h",
  "evento_convidados": [],
  "evento_meet": false,
  "job": "",
  "notes": ""
}

---
REGRA IMPORTANTE SOBRE JOB

Se a mensagem mencionar claramente o cliente, filme ou job, preencher o campo "job".
Exemplos comuns de job: Assai, Habibs, Caixa, Vivo, Nike, Itau, Brahma

IMPORTANTE: Se a mensagem NAO mencionar job mas existir um JOB_ATUAL fornecido, usar esse JOB_ATUAL.
Exemplo: JOB_ATUAL: Assai / Mensagem: "revisar shooting" → job: "Assai"

Se NAO houver job na mensagem e tambem NAO houver JOB_ATUAL: "precisa_job": true

NORMALIZACAO DE JOB: Considere variacoes de escrita como o mesmo job.
Assai/Assai/açai → Assai. Habib's/Habibs → Habibs

---
MAPEAMENTO DE DEPARTAMENTOS (tarefas apenas):

Direcao: shooting, shooting board, storyboard, quadro de cena, roteiro tecnico, decupagem, PPM, pasta de PPM, OD, ordem do dia, ensaio, linguagem de cena, planos
Elenco: casting, teste de elenco, aprovacao de elenco
Direcao de Arte: cenografia, cenario, adereco, objeto de cena, props, ambientacao
Producao Geral: locacao, visita tecnica, fornecedor, transporte, reserva, logistica
Fotografia: camera, lente, diretor de fotografia, luz
Figurino: figurino, roupa, prova de roupa
Atendimento: cliente, agencia, reuniao com agencia, reuniao com cliente
Outro: quando nao for possivel identificar

REGRA DE DESEMPATE:
- shooting = Direcao (NUNCA Direcao de Arte)
- PPM = Direcao
- OD = Direcao
- pasta de PPM = Direcao
- locacao = Producao Geral

---
OUTRAS REGRAS

- "resumo_tarefa": descricao curta e clara, preservar palavras originais
- "prazo": preencher so se houver data/horario claro (hoje, amanha, 12/03, etc.)
- "responsavel": preencher so se uma pessoa for citada explicitamente
- "notes": detalhes uteis da mensagem original

IGNORAR mensagens como: ok, obrigado, entendido, emoji, conversa casual.

Toda acao concluida deve ter confirmacao. Se faltar dado essencial, indique no JSON.`;

export async function classifyMessage(
  message: string,
  jobAtual: string | null,
  _isAudio: boolean = false,
): Promise<BobClassification> {
  const systemPrompt = SYSTEM_PROMPT_PUBLICIDADE;

  const userPrompt = `JOB_ATUAL: ${jobAtual ?? "nenhum"}\n\nMENSAGEM_USUARIO:\n${message}\n\nAnalise e responda apenas com JSON valido.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.2, maxTokens: 600 },
  );

  // Tenta extrair JSON da resposta
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { ignorar: true, acao: "conversa" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as BobClassification;
  } catch {
    return { ignorar: true, acao: "conversa" };
  }
}

export async function transcribeTelegramAudio(fileUrl: string): Promise<string> {
  // Baixa o arquivo de audio e transcreve
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") ?? "audio/ogg";
  return transcribeAudio(buffer, mimeType);
}

export async function generateConfirmationMessage(
  classification: BobClassification,
  _language: string = "pt",
): Promise<string> {
  const systemPrompt = `Voce e o Bob, um assistente de producao audiovisual. Seja objetivo, claro e rapido. Respostas curtas. Confirme acoes concluidas. Use portugues do Brasil.`;

  let userPrompt = "";
  if (classification.acao === "tarefa") {
    userPrompt = `Confirme que a tarefa foi registrada:\nJob: ${classification.job ?? "N/A"}\nTarefa: ${classification.resumo_tarefa ?? ""}\nDepartamento: ${classification.departamento ?? ""}\nPrazo: ${classification.prazo ?? ""}\n
Responda em 2-3 linhas no maximo, no estilo:\n"Registrado na planilha de trabalho.\nTarefa: [descricao]\nJob: [job]\nPrazo: [prazo]"`;
  } else if (classification.acao === "evento") {
    userPrompt = `Confirme que o evento foi agendado:\nTitulo: ${classification.evento_titulo ?? ""}\nData: ${classification.evento_data ?? ""}\nHorario: ${classification.evento_hora ?? ""}\n\nResponda em 2-3 linhas.`;
  } else if (classification.acao === "consulta") {
    userPrompt = `O usuario pediu uma consulta de tipo: ${classification.consulta_tipo}. Responda que voce esta buscando as informacoes. Resposta de 1 linha.`;
  }

  if (!userPrompt) {
    return "Entendido.";
  }

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.4, maxTokens: 200 },
  );

  return response;
}

export async function generateClarificationQuestion(
  missingField: string,
  context?: Record<string, any>,
): Promise<string> {
  const systemPrompt = `Voce e o Bob, assistente de producao. Pergunte de forma objetiva o que falta. 1 linha apenas. Portugues do Brasil.`;

  const questions: Record<string, string> = {
    job: "Qual e o job ou cliente?",
    time: "Qual horario voce quer?",
    date: "Qual data?",
    meet: "Quer que eu adicione um link de Google Meet?",
    guests: "Quais e-mails devem receber o convite?",
    description: "Pode me dar mais detalhes sobre a tarefa?",
    personal_work: "Isso e pessoal ou do trabalho?",
  };

  const directQuestion = questions[missingField] ?? `Preciso saber: ${missingField}`;

  // Também gera uma versao mais natural via GPT, mas com fallback rapido
  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Pergunte sobre: ${missingField}. Contexto: ${JSON.stringify(context ?? {})}` },
      ],
      { temperature: 0.5, maxTokens: 100 },
    );
    return response || directQuestion;
  } catch {
    return directQuestion;
  }
}
