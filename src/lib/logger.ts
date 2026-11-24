/**
 * Structured JSON logs (one line per event), tagged with the current request id.
 * In production this is where an OpenTelemetry exporter / log shipper would
 * plug in; for the exercise, stdout JSON is enough to show the
 * request -> AI -> fallback trail.
 *
 * Deliberately NOT logged: prompts, pasted user text, model outputs (may hold
 * business-sensitive data). Log metadata: task, latency, tokens, outcome.
 */
import { currentRequestId } from "@/lib/request-context";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, event: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    requestId: currentRequestId(),
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (e: string, f?: Record<string, unknown>) => emit("debug", e, f),
  info: (e: string, f?: Record<string, unknown>) => emit("info", e, f),
  warn: (e: string, f?: Record<string, unknown>) => emit("warn", e, f),
  error: (e: string, f?: Record<string, unknown>) => emit("error", e, f),
};
