/**
 * Provider selection from env, via the Vercel AI SDK, so switching between
 * OpenAI / Anthropic / any OpenAI-compatible gateway is a config change.
 *
 *   AI_PROVIDER=anthropic|openai   (default: anthropic if its key is present)
 *   AI_MODEL=<model id>            (defaults below)
 *   ANTHROPIC_API_KEY (primary) / OPENAI_API_KEY (optional alternative)
 *   AI_BASE_URL                    (optional: Azure/OpenRouter/LiteLLM gateway)
 *
 * No key -> returns null and every AI feature runs in fallback mode. The app
 * stays fully usable without AI, which is the point.
 */
import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export type ProviderName = "openai" | "anthropic";

/**
 * Sonnet by default: extraction accuracy is a scoring criterion and latency (a few
 * seconds) fits the 15 s budget. Set AI_MODEL=claude-haiku-5-5 for speed/cost.
 */
const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-5-5",
  openai: "gpt-4o-mini",
};

export interface AiConfig {
  provider: ProviderName;
  modelId: string;
}

export function getAiConfig(): AiConfig | null {
  const explicit = process.env.AI_PROVIDER as ProviderName | undefined;
  const provider: ProviderName | null =
    explicit ??
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.OPENAI_API_KEY ? "openai" : null);
  if (!provider) return null;

  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  return { provider, modelId: process.env.AI_MODEL || DEFAULT_MODELS[provider] };
}

export function getModel(): LanguageModel | null {
  const cfg = getAiConfig();
  if (!cfg) return null;
  const baseURL = process.env.AI_BASE_URL || undefined;
  if (cfg.provider === "openai") {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL })(cfg.modelId);
  }
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL })(cfg.modelId);
}
