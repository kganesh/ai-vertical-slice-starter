import { CreateCertificateInput, ListCertificatesQuery } from "@/domain/certificate";
import { parseJson, parseQuery, withErrorHandling } from "@/lib/api-handler";
import { certificateRepo } from "@/server/container";

export const GET = withErrorHandling(async (req) => {
  const query = parseQuery(req, ListCertificatesQuery);
  return Response.json({ certificates: await certificateRepo.list(query) });
});

export const POST = withErrorHandling(async (req) => {
  const input = await parseJson(req, CreateCertificateInput);
  const certificate = await certificateRepo.create(input);
  return Response.json({ certificate }, { status: 201 });
});
