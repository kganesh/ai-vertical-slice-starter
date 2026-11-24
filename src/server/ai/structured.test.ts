import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { generateStructured } from "./structured";
import { heuristicSuggestion, suggestItem } from "./features/suggest-item";

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

describe("suggest-item", () => {
  it("heuristic extracts quantity, unit and category", () => {
    const s = heuristicSuggestion("Q4 solar delivery\nTotal 8,250 MWh delivered");
    expect(s).toMatchObject({ quantity: 8250, unit: "MWh", category: "energy", confidence: 0.3 });
  });

  it("heuristic flags missing fields instead of guessing", () => {
    const s = heuristicSuggestion("Some note without numbers");
    expect(s.quantity).toBeNull();
    expect(s.missingFields).toEqual(expect.arrayContaining(["quantity", "unit", "category"]));
  });

  it("runs in fallback mode without an API key and requires review", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const r = await suggestItem("Delivered 1,200 MWh of wind energy in October");
    expect(r.source).toBe("fallback");
    expect(r.needsReview).toBe(true);
  });
});
