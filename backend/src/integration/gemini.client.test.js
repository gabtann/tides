import test from "node:test";
import assert from "node:assert/strict";
import { config } from "../config/env.js";

test("Groq client is configured", () => {
  assert.ok(config.groqApiKey);
});

test("Groq generateText uses a 20-second timeout and does not retry provider failures", async () => {
  const originalFetch = global.fetch;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const timeoutValues = [];
  let requestCount = 0;
  let shouldFail = false;

  global.fetch = async () => {
    requestCount += 1;
    if (shouldFail) {
      return new Response(
        JSON.stringify({ error: { message: "Rate limited" } }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        id: "test-completion",
        object: "chat.completion",
        created: 0,
        model: "openai/gpt-oss-20b",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "OK" },
            finish_reason: "stop",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
  global.setTimeout = (callback, delay, ...args) => {
    timeoutValues.push(delay);
    return originalSetTimeout(callback, delay, ...args);
  };

  try {
    const { generateText } = await import(
      `./gemini.client.js?timeout-test=${Date.now()}`
    );

    assert.equal(await generateText("Reply with OK"), "OK");
    assert.equal(requestCount, 1);
    assert.ok(timeoutValues.includes(20_000));

    shouldFail = true;
    const requestsBeforeFailure = requestCount;
    await assert.rejects(
      () => generateText("Trigger a stubbed provider failure"),
      (error) => error.status === 429,
    );
    assert.equal(requestCount - requestsBeforeFailure, 1);
  } finally {
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  }
});
