import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JsonFileCertificateRepository } from "./json-file-repository";

const newRepo = () =>
  new JsonFileCertificateRepository(
    path.join(mkdtempSync(path.join(os.tmpdir(), "repo-")), "certificates.json"),
  );

const input = {
  projectName: "Lone Star Wind",
  energyType: "wind" as const,
  region: "ERCOT" as const,
  vintage: 2026,
  mwh: 2500,
};

describe("JsonFileCertificateRepository", () => {
  it("creates, reads, updates and deletes", async () => {
    const repo = newRepo();
    const created = await repo.create(input);
    expect(created).toMatchObject({ ...input, status: "available", source: "manual" });
    expect(await repo.get(created.id)).toEqual(created);
    const updated = await repo.update(created.id, { status: "retired" });
    expect(updated?.status).toBe("retired");
    expect(await repo.delete(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
  });

  it("filters by search text and region", async () => {
    const repo = newRepo();
    await repo.create(input);
    await repo.create({ ...input, projectName: "Mesa Verde Solar", region: "WECC" });
    expect((await repo.list({ q: "mesa" })).map((c) => c.projectName)).toEqual([
      "Mesa Verde Solar",
    ]);
    expect((await repo.list({ region: "ERCOT" })).map((c) => c.projectName)).toEqual([
      "Lone Star Wind",
    ]);
  });

  it("does not lose writes under concurrency", async () => {
    const repo = newRepo();
    await Promise.all(
      Array.from({ length: 20 }, (_, i) => repo.create({ ...input, projectName: `p${i}` })),
    );
    expect(await repo.list()).toHaveLength(20);
  });

  it("returns null when updating a missing id", async () => {
    expect(await newRepo().update("nope", { mwh: 5 })).toBeNull();
  });
});
