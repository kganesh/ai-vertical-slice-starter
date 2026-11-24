import { connection } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { getCoverage } from "@/server/matching-service";

export const GET = withErrorHandling(async () => {
  await connection();
  return Response.json(await getCoverage());
});
