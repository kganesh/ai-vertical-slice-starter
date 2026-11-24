/**
 * Domain model. This is the ONE file to rename on interview day:
 * "Item" -> whatever the problem is about (Certificate, Meter, Facility, ...).
 * Schemas are shared by the API (validation), the repository and the UI (types).
 */
import { z } from "zod";

export const ITEM_STATUSES = ["draft", "active", "archived"] as const;
export const ITEM_CATEGORIES = ["energy", "emissions", "certificate", "other"] as const;

export const ItemStatus = z.enum(ITEM_STATUSES);
export const ItemCategory = z.enum(ITEM_CATEGORIES);

export const Item = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  category: ItemCategory,
  status: ItemStatus,
  quantity: z.number().nonnegative(),
  unit: z.string(),
  /** Provenance: was this record drafted by AI and confirmed by a human? */
  source: z.enum(["manual", "ai_assisted"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Item = z.infer<typeof Item>;

export const CreateItemInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).default(""),
  category: ItemCategory,
  status: ItemStatus.default("draft"),
  quantity: z.coerce.number().nonnegative("Must be 0 or more"),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  source: z.enum(["manual", "ai_assisted"]).default("manual"),
});
export type CreateItemInput = z.input<typeof CreateItemInput>;

export const UpdateItemInput = CreateItemInput.partial();
export type UpdateItemInput = z.input<typeof UpdateItemInput>;

export const ListItemsQuery = z.object({
  q: z.string().trim().optional(),
  status: ItemStatus.optional(),
  category: ItemCategory.optional(),
});
export type ListItemsQuery = z.infer<typeof ListItemsQuery>;
