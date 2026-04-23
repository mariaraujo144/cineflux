import { env } from "./lib/env";

const TELEGRAM_API = `https://api.telegram.org/bot${env.telegramBotToken}`;

/**
 * Envia mensagem de texto para um chat do Telegram
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    replyToMessageId?: number;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  },
): Promise<void> {
  const url = `${TELEGRAM_API}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.substring(0, 4096),
      reply_to_message_id: options?.replyToMessageId,
      parse_mode: options?.parseMode,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Telegram] Failed to send message: ${error}`);
    throw new Error(`Telegram API error: ${response.status}`);
  }
}

/**
 * Envia mensagem com teclado inline (botoes)
 */
export async function sendTelegramInlineKeyboard(
  chatId: string | number,
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>,
): Promise<void> {
  const url = `${TELEGRAM_API}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.substring(0, 4096),
      reply_markup: { inline_keyboard: buttons },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Telegram] Failed to send keyboard: ${error}`);
    throw new Error(`Telegram API error: ${response.status}`);
  }
}

/**
 * Obtem o URL do arquivo de audio do Telegram
 */
export async function getTelegramFileUrl(fileId: string): Promise<string> {
  const fileInfoResponse = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  if (!fileInfoResponse.ok) {
    throw new Error("Failed to get file info from Telegram");
  }

  const fileInfo = (await fileInfoResponse.json()) as { ok: boolean; result?: { file_path?: string } };
  const filePath = fileInfo.result?.file_path;

  if (!filePath) {
    throw new Error("No file path found");
  }

  return `https://api.telegram.org/file/bot${env.telegramBotToken}/${filePath}`;
}

/**
 * Configura o webhook do bot para apontar para nosso backend
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const url = `${TELEGRAM_API}/setWebhook`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  const data = (await response.json()) as { ok: boolean; description?: string };
  console.log("[Telegram] Webhook set:", data);
  return data.ok === true;
}

/**
 * Remove o webhook
 */
export async function deleteTelegramWebhook(): Promise<boolean> {
  const response = await fetch(`${TELEGRAM_API}/deleteWebhook`);
  const data = (await response.json()) as { ok: boolean };
  return data.ok === true;
}

/**
 * Obtem informacoes sobre o bot
 */
export async function getBotInfo(): Promise<{ ok: boolean; result?: { username: string; first_name: string } }> {
  const response = await fetch(`${TELEGRAM_API}/getMe`);
  return response.json() as Promise<{ ok: boolean; result?: { username: string; first_name: string } }>;
}
