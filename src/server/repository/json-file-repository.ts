import { promises as fs } from "node:fs";
import path from "node:path";
import { CreateItemInput, Item, UpdateItemInput, type ListItemsQuery } from "@/domain/item";
import type { ItemRepository } from "./types";

/**
 * Zero-setup persistence: a JSON file, written atomically (tmp + rename), with
 * writes serialized through a promise chain so concurrent requests can't
 * clobber each other. Good enough for a demo; NOT for multi-instance prod.
 *
 * On Vercel the deploy dir is read-only, so DATA_DIR defaults to /tmp there
 * (ephemeral per instance, which is fine for a demo and called out in docs).
 */
export class JsonFileItemRepository implements ItemRepository {
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly seed: () => Item[] = () => [],
  ) {}

  private async readAll(): Promise<Item[]> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return Item.array().parse(JSON.parse(raw));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        const seeded = this.seed();
        await this.writeAll(seeded);
        return seeded;
      }
      throw err;
    }
  }

  private async writeAll(items: Item[]) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2));
    await fs.rename(tmp, this.filePath);
  }

  /** Serialize read-modify-write cycles. */
  private mutate<T>(fn: (items: Item[]) => { items: Item[]; result: T }): Promise<T> {
    const next = this.writeChain.then(async () => {
      const { items, result } = fn(await this.readAll());
      await this.writeAll(items);
      return result;
    });
    this.writeChain = next.catch(() => undefined);
    return next;
  }

  async list(query: ListItemsQuery = {}) {
    const q = query.q?.toLowerCase();
    return (await this.readAll())
      .filter((i) => !query.status || i.status === query.status)
      .filter((i) => !query.category || i.category === query.category)
      .filter(
        (i) => !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string) {
    return (await this.readAll()).find((i) => i.id === id) ?? null;
  }

  create(input: CreateItemInput) {
    const data = CreateItemInput.parse(input);
    const now = new Date().toISOString();
    const item: Item = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    return this.mutate((items) => ({ items: [item, ...items], result: item }));
  }

  update(id: string, input: UpdateItemInput) {
    const patch = UpdateItemInput.parse(input);
    return this.mutate((items) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return { items, result: null };
      const updated: Item = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
      const copy = [...items];
      copy[idx] = updated;
      return { items: copy, result: updated };
    });
  }

  delete(id: string) {
    return this.mutate((items) => {
      const remaining = items.filter((i) => i.id !== id);
      return { items: remaining, result: remaining.length !== items.length };
    });
  }
}
