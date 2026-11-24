import { CreateItemInput, ListItemsQuery } from "@/domain/item";
import { parseJson, parseQuery, withErrorHandling } from "@/lib/api-handler";
import { itemRepo } from "@/server/container";

export const GET = withErrorHandling(async (req) => {
  const query = parseQuery(req, ListItemsQuery);
  return Response.json({ items: await itemRepo.list(query) });
});

export const POST = withErrorHandling(async (req) => {
  const input = await parseJson(req, CreateItemInput);
  const item = await itemRepo.create(input);
  return Response.json({ item }, { status: 201 });
});
