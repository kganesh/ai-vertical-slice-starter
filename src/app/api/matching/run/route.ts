import { withErrorHandling } from "@/lib/api-handler";
import { runMatching } from "@/server/matching-service";

export const POST = withErrorHandling(async () => Response.json(await runMatching()));
