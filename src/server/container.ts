/**
 * Composition root: the only place that picks concrete implementations.
 * Swap storage or AI provider here without touching routes or UI.
 */
import path from "node:path";
import os from "node:os";
import { JsonFileItemRepository } from "@/server/repository/json-file-repository";
import type { ItemRepository } from "@/server/repository/types";
import { seedItems } from "@/server/seed";

const dataDir =
  process.env.DATA_DIR ??
  (process.env.VERCEL ? path.join(os.tmpdir(), "app-data") : path.join(process.cwd(), ".data"));

// Survive Next.js dev hot-reloads without creating a new instance each time.
const globalForContainer = globalThis as unknown as { itemRepo?: ItemRepository };

export const itemRepo: ItemRepository =
  globalForContainer.itemRepo ??
  new JsonFileItemRepository(path.join(dataDir, "items.json"), seedItems);

if (process.env.NODE_ENV !== "production") globalForContainer.itemRepo = itemRepo;
