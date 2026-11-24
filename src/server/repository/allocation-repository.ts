import { promises as fs } from "node:fs";
import path from "node:path";
import { Allocation } from "@/domain/allocation";

export interface AllocationRepository {
  list(): Promise<Allocation[]>;
  /** Atomically swap all draft allocations; final ones are untouched. */
  replaceDrafts(drafts: Omit<Allocation, "id" | "status">[]): Promise<Allocation[]>;
}

/** Same atomic tmp+rename and serialized-write approach as the certificate store. */
export class JsonFileAllocationRepository implements AllocationRepository {
  private chain: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async list(): Promise<Allocation[]> {
    try {
      return Allocation.array().parse(JSON.parse(await fs.readFile(this.filePath, "utf8")));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  replaceDrafts(drafts: Omit<Allocation, "id" | "status">[]) {
    const next = this.chain.then(async () => {
      const finals = (await this.list()).filter((a) => a.status === "final");
      const all: Allocation[] = [
        ...finals,
        ...drafts.map((d) => ({ ...d, id: crypto.randomUUID(), status: "draft" as const })),
      ];
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(all, null, 2));
      await fs.rename(tmp, this.filePath);
      return all;
    });
    this.chain = next.catch(() => undefined);
    return next;
  }
}
