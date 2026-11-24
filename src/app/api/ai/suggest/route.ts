import { parseJson, withErrorHandling } from "@/lib/api-handler";
import {
  SuggestCertificateInput,
  suggestCertificate,
} from "@/server/ai/features/suggest-certificate";

// AI calls can take a few seconds; give the function room on Vercel.
export const maxDuration = 30;

/**
 * Always returns 200 with a usable draft. AI failure is a degraded mode,
 * not an error: the response says `source: "fallback"` and why.
 */
export const POST = withErrorHandling(async (req) => {
  const { text } = await parseJson(req, SuggestCertificateInput);
  return Response.json(await suggestCertificate(text));
});
