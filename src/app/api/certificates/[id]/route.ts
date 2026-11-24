import { UpdateCertificateInput } from "@/domain/certificate";
import { parseJson, withErrorHandling } from "@/lib/api-handler";
import { notFound } from "@/lib/errors";
import { certificateRepo } from "@/server/container";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const certificate = await certificateRepo.get(id);
  if (!certificate) throw notFound("Certificate");
  return Response.json({ certificate });
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const patch = await parseJson(req, UpdateCertificateInput);
  const certificate = await certificateRepo.update(id, patch);
  if (!certificate) throw notFound("Certificate");
  return Response.json({ certificate });
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!(await certificateRepo.delete(id))) throw notFound("Certificate");
  return new Response(null, { status: 204 });
});
