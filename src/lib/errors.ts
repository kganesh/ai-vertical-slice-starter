/**
 * One error shape for the whole app. Every API failure returns:
 *   { error: { code, message, details?, requestId } }
 * The client maps `code` to UX (toast, inline field errors, retry button).
 */
export const ERROR_CODES = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  get status() {
    return ERROR_CODES[this.code];
  }
}

export const notFound = (what: string) => new AppError("NOT_FOUND", `${what} not found`);
