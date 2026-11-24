/**
 * Per-request context via AsyncLocalStorage (Node's equivalent of SLF4J MDC).
 * Anything logged while handling a request, including deep inside AI calls,
 * automatically carries that request's id without passing it around.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/** Honour an incoming id (e.g. from a gateway or the browser) so traces join up. */
export function requestIdFrom(req: Request): string {
  const incoming = req.headers.get("x-request-id");
  return incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
}
