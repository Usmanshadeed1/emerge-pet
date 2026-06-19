import { db } from "./db";
import { getSetting, setSetting, decrypt } from "./settings";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallAIOptions {
  jsonMode?: boolean;
}

export async function callAI(
  messages: Message[],
  options: CallAIOptions = {}
): Promise<string> {
  const configs = await db.llmConfig.findMany({
    where:   { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!configs.length) {
    throw new Error("No AI provider configured — add one in Admin > App Settings");
  }

  const indexRaw    = await getSetting("llm_active_index");
  const currentIndex = parseInt(indexRaw ?? "0", 10) || 0;
  const config       = configs[currentIndex % configs.length];
  const nextIndex    = (currentIndex + 1) % configs.length;
  await setSetting("llm_active_index", String(nextIndex));

  return callProvider(config.baseUrl, decrypt(config.apiKey), config.model, messages, options);
}

export async function callProviderDirect(
  baseUrl: string,
  apiKey:  string,
  model:   string,
  messages: Message[],
  options:  CallAIOptions = {}
): Promise<string> {
  return callProvider(baseUrl, apiKey, model, messages, options);
}

async function callProvider(
  baseUrl:  string,
  apiKey:   string,
  model:    string,
  messages: Message[],
  options:  CallAIOptions
): Promise<string> {
  const url  = baseUrl.replace(/\/$/, "") + "/chat/completions";
  const body: Record<string, unknown> = { model, messages };

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown error");
    throw new Error(`AI request failed (${res.status}): ${err}`);
  }

  const data    = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("AI returned an unexpected response format");
  }

  return content;
}
