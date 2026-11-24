import { afterEach, describe, expect, it } from "vitest";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { getAiConfig } from "./provider";
import { generateStructured } from "./structured";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("getAiConfig", () => {
  it("defaults to Anthropic Sonnet when only an Anthropic key is set", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    expect(getAiConfig()).toEqual({ provider: "anthropic", modelId: "claude-sonnet-5-5" });
  });

  it("honours AI_MODEL", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.AI_MODEL = "claude-haiku-5-5";
    expect(getAiConfig()?.modelId).toBe("claude-haiku-5-5");
  });

  it("returns null (fallback mode) with no key", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(getAiConfig()).toBeNull();
  });
});

/**
 * Runs the real Anthropic provider with the network stubbed, so the request
 * shape and response parsing are exercised without an API key.
 */
describe("Anthropic structured output (stubbed network)", () => {
  const schema = z.object({ label: z.string(), score: z.number() });

  function stubbedModel(replyText: string, captured: { body?: Record<string, unknown> }) {
    const fetchStub: typeof fetch = async (_url, init) => {
      captured.body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-5-5",
          content: [{ type: "text", text: replyText }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 12, output_tokens: 8 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    return createAnthropic({ apiKey: "sk-ant-test", fetch: fetchStub })("claude-sonnet-5-5");
  }

  it("sends a schema-constrained request and parses the JSON reply", async () => {
    const captured: { body?: Record<string, unknown> } = {};
    const r = await generateStructured({
      task: "test",
      schema,
      system: "sys",
      prompt: "p",
      fallback: () => ({ label: "fallback", score: 0 }),
      model: stubbedModel('{"label":"ok","score":0.9}', captured),
    });
    expect(r).toMatchObject({ source: "ai", data: { label: "ok", score: 0.9 } });
    expect(captured.body?.model).toBe("claude-sonnet-5-5");
    // The JSON schema must be sent to Claude in some form (native output format or JSON tool).
    expect(JSON.stringify(captured.body)).toContain('"label"');
  });

  it("falls back when Claude returns JSON that violates the schema", async () => {
    const r = await generateStructured({
      task: "test",
      schema,
      system: "sys",
      prompt: "p",
      fallback: () => ({ label: "fallback", score: 0 }),
      model: stubbedModel('{"label":"ok"}', {}),
    });
    expect(r).toMatchObject({ source: "fallback", reason: "invalid_output" });
  });
});
