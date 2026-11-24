import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JsonFileItemRepository } from "./json-file-repository";

const newRepo = () =>
  new JsonFileItemRepository(path.join(mkdtempSync(path.join(os.tmpdir(), "repo-")), "items.json"));

const input = { name: "Wind Q1", category: "energy" as const, quantity: 10, unit: "MWh" };

describe("JsonFileItemRepository", () => {
  it("creates, reads, updates and deletes", async () => {
    const repo = newRepo();
    const created = await repo.create(input);
    expect(created).toMatchObject({ ...input, status: "draft", source: "manual" });
    expect(await repo.get(created.id)).toEqual(created);

    const updated = await repo.update(created.id, { status: "active" });
    expect(updated?.status).toBe("active");

    expect(await repo.delete(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
  });

  it("filters by search text and status", async () => {
    const repo = newRepo();
    await repo.create(input);
    await repo.create({ ...input, name: "Solar Q1", status: "active" });
    expect((await repo.list({ q: "solar" })).map((i) => i.name)).toEqual(["Solar Q1"]);
    expect((await repo.list({ status: "draft" })).map((i) => i.name)).toEqual(["Wind Q1"]);
  });

  it("does not lose writes under concurrency", async () => {
    const repo = newRepo();
    await Promise.all(
      Array.from({ length: 20 }, (_, i) => repo.create({ ...input, name: `n${i}` })),
    );
    expect(await repo.list()).toHaveLength(20);
  });

  it("returns null when updating a missing id", async () => {
    expect(await newRepo().update("nope", { name: "x" })).toBeNull();
  });
});
