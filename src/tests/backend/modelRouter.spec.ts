/** @vitest-environment node */

import { afterEach, describe, expect, test, vi } from "vitest";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

function resetEnv() {
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  resetEnv();
  global.fetch = originalFetch;
});

describe("runWithBestModel diagnostics", () => {
  test("logs provider unavailability when OpenAI key is missing", async () => {
    resetEnv();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runWithBestModel } = await import(
      "../../../backend/src/ai/modelRouter.js"
    );

    await expect(
      runWithBestModel({
        taskType: "emotional_coaching",
        systemPrompt: "system",
        userMessage: "hello",
      })
    ).rejects.toThrow(/AI routing failed/);

    expect(errorSpy).toHaveBeenCalledWith(
      "[AI][provider] unavailable",
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4o-mini",
        apiKeyPresent: false,
        message: expect.stringContaining("OPENAI_API_KEY"),
      })
    );
  });

  test("logs provider error details when OpenAI call fails", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

    const upstreamError = new Error("Upstream failure");
    // @ts-expect-error custom status for testing
    upstreamError.status = 500;

    const fetchMock = vi.fn().mockImplementation(async (_input) => {
      if (fetchMock.mock.calls.length === 0) {
        throw upstreamError;
      }

      return new Response(
        JSON.stringify({
          content: [{ text: "fallback from claude" }],
          usage: { input_tokens: 1, output_tokens: 1 },
          stop_reason: "end",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    global.fetch = fetchMock;

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runWithBestModel } = await import(
      "../../../backend/src/ai/modelRouter.js"
    );

    const result = await runWithBestModel({
      taskType: "emotional_coaching",
      systemPrompt: "system",
      userMessage: "hello",
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[AI][provider] call",
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4o-mini",
        apiKeyPresent: true,
      })
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "[AI][provider] error",
      expect.objectContaining({
        provider: "openai",
        model: "gpt-4o-mini",
        apiKeyPresent: true,
        message: expect.stringMatching(/connection/i),
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        model: "anthropic",
        text: "fallback from claude",
      })
    );
  });
});
