/**
 * The one AI entry point every feature goes through.
 *
 * Guarantees to callers:
 *  1. Output is schema-valid (zod) or you get the fallback. Never half-parsed JSON.
 *  2. Bounded latency: hard timeout + 1 retry, then fallback.
 *  3. Business-rule validation hook (`check`) for things a schema can't express.
 *  4. Every result says where it came from (`source`) and why it fell back,
 *     so the UI can label it honestly and logs show the trail.
 */
import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";
import { getModel } from "./provider";
import { log } from "@/lib/logger";

export type FallbackReason =
  "not_configured" | "timeout" | "invalid_output" | "failed_check" | "provider_error";

export type AiResult<T> =
  | { source: "ai"; data: T; latencyMs: number }
  | { source: "fallback"; data: T; latencyMs: number; reason: FallbackReason };

export interface StructuredRequest<S extends z.ZodType> {
  /** Short name for logs/metrics, e.g. "suggest_item". */
  task: string;
  schema: S;
  system: string;
  prompt: string;
  /** Deterministic answer used whenever the model can't be trusted. */
  fallback: () => z.output<S>;
  /** Extra business-rule checks. Return an error string to reject the AI output. */
  check?: (data: z.output<S>) => string | null;
  timeoutMs?: number;
  /** Injected in tests; defaults to the env-configured provider. */
  model?: LanguageModel | null;
}

export async function generateStructured<S extends z.ZodType>(
  req: StructuredRequest<S>,
): Promise<AiResult<z.output<S>>> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  const model = req.model === undefined ? getModel() : req.model;

  const fallback = (reason: FallbackReason, detail?: string): AiResult<z.output<S>> => {
    log.warn("ai_fallback", { task: req.task, reason, detail, ms: elapsed() });
    return { source: "fallback", reason, data: req.fallback(), latencyMs: elapsed() };
  };

  if (!model) return fallback("not_configured");

  try {
    const result = await generateText({
      model,
      system: req.system,
      prompt: req.prompt,
      output: Output.object({ schema: req.schema }),
      temperature: 0,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(req.timeoutMs ?? 15_000),
    });
    const data = result.output as z.output<S>;

    const problem = req.check?.(data);
    if (problem) return fallback("failed_check", problem);

    log.info("ai_success", {
      task: req.task,
      ms: elapsed(),
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
    });
    return { source: "ai", data, latencyMs: elapsed() };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : String(err);
    if (name === "TimeoutError" || name === "AbortError" || /abort|timeout/i.test(message)) {
      return fallback("timeout", message);
    }
    if (/NoObjectGenerated|NoOutputGenerated|TypeValidation|JSONParse/i.test(name + message)) {
      return fallback("invalid_output", message);
    }
    return fallback("provider_error", message);
  }
}

/**
 * Wrap untrusted user text so the model treats it as data, not instructions.
 * (Basic prompt-injection hygiene; pair it with schema-constrained output.)
 */
export function asUntrustedInput(label: string, text: string) {
  const safe = text.replaceAll(`</${label}>`, "");
  return `<${label}>\n${safe}\n</${label}>`;
}
