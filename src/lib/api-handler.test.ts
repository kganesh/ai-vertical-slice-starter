import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "./errors";
import { parseJson, withErrorHandling } from "./api-handler";

const post = (body: string) =>
  new Request("http://test/api/x", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });

describe("withErrorHandling", () => {
  it("maps AppError to its status and code", async () => {
    const h = withErrorHandling(async () => {
      throw new AppError("NOT_FOUND", "Item not found");
    });
    const res = await h(post("{}"), {});
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatchObject({
      code: "NOT_FOUND",
      message: "Item not found",
    });
  });

  it("hides unknown error details behind a generic 500", async () => {
    const h = withErrorHandling(async () => {
      throw new Error("db password is hunter2");
    });
    const res = await h(post("{}"), {});
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(body.error.requestId).toBeTruthy();
  });

  it("returns field errors for invalid input", async () => {
    const h = withErrorHandling(async (req) => {
      await parseJson(req, z.object({ name: z.string().min(1) }));
      return Response.json({});
    });
    const res = await h(post('{"name":""}'), {});
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.name).toBeTruthy();
  });

  it("rejects malformed JSON with a 400", async () => {
    const h = withErrorHandling(async (req) => {
      await parseJson(req, z.object({}));
      return Response.json({});
    });
    expect((await h(post("{not json"), {})).status).toBe(400);
  });
});
