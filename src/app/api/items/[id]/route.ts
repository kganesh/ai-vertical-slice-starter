import { UpdateItemInput } from "@/domain/item";
import { parseJson, withErrorHandling } from "@/lib/api-handler";
import { notFound } from "@/lib/errors";
import { itemRepo } from "@/server/container";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const item = await itemRepo.get(id);
  if (!item) throw notFound("Item");
  return Response.json({ item });
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const patch = await parseJson(req, UpdateItemInput);
  const item = await itemRepo.update(id, patch);
  if (!item) throw notFound("Item");
  return Response.json({ item });
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!(await itemRepo.delete(id))) throw notFound("Item");
  return new Response(null, { status: 204 });
});
