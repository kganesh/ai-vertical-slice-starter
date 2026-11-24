/**
 * Browser-side fetch wrapper. Always resolves to data or throws ApiError with
 * the server's error code, so components can branch on `err.code`.
 */
import type { ApiErrorBody, ErrorCode } from "@/lib/errors";

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode | "NETWORK",
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field errors from a VALIDATION response, keyed by field name. */
  get fieldErrors(): Record<string, string[] | undefined> {
    const d = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    return d?.fieldErrors ?? {};
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...rest.headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("NETWORK", "Can't reach the server. Check your connection.", 0);
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      e?.code ?? "INTERNAL",
      e?.message ?? `Request failed (${res.status})`,
      res.status,
      e?.details,
    );
  }
  return body as T;
}
