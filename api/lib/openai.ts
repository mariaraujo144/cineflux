import OpenAI from "openai";
import { env } from "./env";

let client: OpenAI | null = null;

export function getOpenAI() {
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const openai = getOpenAI();
  const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp3") ? "mp3" : "webm";
  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(audioBuffer);
  const file = new File([uint8Array], `audio.${extension}`, { type: mimeType });

  const result = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "pt",
    response_format: "text",
  });

  return result as unknown as string;
}

export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const openai = getOpenAI();
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 800,
  });
  return result.choices[0]?.message?.content ?? "";
}
