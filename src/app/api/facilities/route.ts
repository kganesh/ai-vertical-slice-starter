import { connection } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { facilityRepo } from "@/server/container";

export const GET = withErrorHandling(async () => {
  await connection();
  return Response.json({ facilities: await facilityRepo.list() });
});
