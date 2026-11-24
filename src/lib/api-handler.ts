/**
 * Server-side helpers for Route Handlers:
 *  - withErrorHandling(): turns thrown errors into the standard error body
 *  - parseJson()/parseQuery(): zod validation with field-level details
 * Keeps each route.ts down to "validate -> call service -> return".
 */
import { z } from "zod";
import { AppError, type ApiErrorBody } from "@/lib/errors";
import { log } from "@/lib/logger";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function withErrorHandling<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    try {
      const res = await handler(req, ctx);
      log.info("request", {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        status: res.status,
        ms: Math.round(performance.now() - started),
      });
      return res;
    } catch (err) {
      const appErr =
        err instanceof AppError
          ? err
          : new AppError("INTERNAL", "Something went wrong. Please try again.");
      log[appErr.status >= 500 ? "error" : "warn"]("request_failed", {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        code: appErr.code,
        // Never leak internals to the client; log them server-side only.
        cause: err instanceof Error ? err.message : String(err),
      });
      const body: ApiErrorBody = {
        error: {
          code: appErr.code,
          message: appErr.message,
          details: appErr.details,
          requestId,
        },
      };
      return Response.json(body, { status: appErr.status });
    }
  };
}

function toValidationError(error: z.ZodError) {
  return new AppError("VALIDATION", "Please fix the highlighted fields.", {
    fieldErrors: z.flattenError(error).fieldErrors,
  });
}

export async function parseJson<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("VALIDATION", "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(
    [...new URL(req.url).searchParams.entries()].filter(([, v]) => v !== ""),
  );
  const result = schema.safeParse(params);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}
