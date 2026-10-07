import test from "node:test";
import assert from "node:assert/strict";
import { config } from "../config/env.js";
import { generateText } from "./gemini.client.js";

test("Groq client is configured", () => {
  assert.equal(typeof generateText, "function");
  assert.ok(config.groqApiKey);
});
