import type { CreateItemInput, Item, ListItemsQuery, UpdateItemInput } from "@/domain/item";

/**
 * Storage port. Routes and services depend on this interface only, so the
 * JSON-file adapter can be swapped for Postgres/Prisma/Drizzle without
 * touching the API or UI.
 */
export interface ItemRepository {
  list(query?: ListItemsQuery): Promise<Item[]>;
  get(id: string): Promise<Item | null>;
  create(input: CreateItemInput): Promise<Item>;
  update(id: string, input: UpdateItemInput): Promise<Item | null>;
  delete(id: string): Promise<boolean>;
}
