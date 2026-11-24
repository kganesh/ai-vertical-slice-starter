import { connection } from "next/server";
import { getAiConfig } from "@/server/ai/provider";

/** Liveness + which AI mode is active (never exposes keys). */
export async function GET() {
  // Cache Components is on: opt out of prerendering so env is read per request.
  await connection();
  const ai = getAiConfig();
  return Response.json({
    status: "ok",
    ai: ai ? { enabled: true, provider: ai.provider, model: ai.modelId } : { enabled: false },
  });
}
