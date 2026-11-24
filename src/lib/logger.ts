/**
 * Structured JSON logs (one line per event). In production this is where an
 * OpenTelemetry exporter / log shipper would plug in; for the exercise,
 * stdout JSON is enough to show the request -> AI -> fallback trail.
 */
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, event: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
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
