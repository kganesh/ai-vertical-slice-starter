import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { generateStructured } from "./structured";
import { heuristicSuggestion, suggestCertificate } from "./features/suggest-certificate";

const schema = z.object({ label: z.string(), score: z.number().min(0).max(1) });
const fallback = () => ({ label: "fallback", score: 0 });

function mockReturning(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const base = { task: "test", schema, system: "s", prompt: "p", fallback };

describe("generateStructured", () => {
  it("returns AI output when it is schema-valid", async () => {
    const r = await generateStructured({
      ...base,
      model: mockReturning('{"label":"ok","score":0.9}'),
    });
    expect(r).toMatchObject({ source: "ai", data: { label: "ok", score: 0.9 } });
  });

  it("falls back when no model is configured", async () => {
    const r = await generateStructured({ ...base, model: null });
    expect(r).toMatchObject({ source: "fallback", reason: "not_configured" });
  });

  it("falls back when output fails the schema", async () => {
    const r = await generateStructured({
      ...base,
      model: mockReturning('{"label":"x","score":7}'),
    });
    expect(r).toMatchObject({ source: "fallback", reason: "invalid_output", data: fallback() });
  });

  it("falls back when output is not JSON", async () => {
    const r = await generateStructured({ ...base, model: mockReturning("sorry, I can't") });
    expect(r.source).toBe("fallback");
  });

  it("falls back when a business-rule check fails", async () => {
    const r = await generateStructured({
      ...base,
      model: mockReturning('{"label":"ok","score":0.9}'),
      check: () => "nope",
    });
    expect(r).toMatchObject({ source: "fallback", reason: "failed_check" });
  });

  it("falls back on provider errors", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("503 upstream");
      },
    });
    const r = await generateStructured({ ...base, model });
    expect(r).toMatchObject({ source: "fallback", reason: "provider_error" });
  });
});

describe("suggest-certificate", () => {
  const email =
    "Confirming transfer of 2,500 Wind RECs, ERCOT, vintage 2026, from Lone Star Wind Farm II, tracking ID TX-88213.";

  it("heuristic extracts mwh, region, vintage, type and tracking id", () => {
    expect(heuristicSuggestion(email)).toMatchObject({
      mwh: 2500,
      region: "ERCOT",
      vintage: 2026,
      energyType: "wind",
      trackingId: "TX-88213",
      projectName: "Lone Star Wind Farm II",
      confidence: 0.3,
    });
  });

  it("heuristic flags missing fields instead of guessing", () => {
    const s = heuristicSuggestion("Some note without numbers");
    expect(s.mwh).toBeNull();
    expect(s.missingFields).toEqual(expect.arrayContaining(["mwh", "region", "vintage"]));
  });

  it("runs in fallback mode without an API key and requires review", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const r = await suggestCertificate(email);
    expect(r.source).toBe("fallback");
    expect(r.needsReview).toBe(true);
  });
});
