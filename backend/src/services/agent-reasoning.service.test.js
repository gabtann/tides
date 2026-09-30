import test from "node:test";
import assert from "node:assert/strict";
import { parseAgentResponse } from "./agent-reasoning.service.js";

test("TIDES reasoning parses valid Gemini JSON", () => {
  const response = JSON.stringify({
    ticker: "BBCA",
    signal: "Price movement requires further investigation.",
    observed: [
      "BBCA price increased by 6.2%.",
    ],
    compared: [
      "Peer average change was 1.1%.",
    ],
    interpreted: [
      "The price movement was materially larger than the peer average.",
    ],
    unknown: [
      "The available evidence does not establish the cause of the movement.",
    ],
    evidenceStrength: "MODERATE",
    researchPriority: "HIGH",
    limitation: "Causal explanation requires additional evidence.",
  });

  const result = parseAgentResponse(response);

  assert.equal(typeof result, "object");
  assert.equal(result.ticker, "BBCA");
  assert.equal(typeof result.signal, "string");
  assert.ok(Array.isArray(result.observed));
  assert.ok(Array.isArray(result.compared));
  assert.ok(Array.isArray(result.interpreted));
  assert.ok(Array.isArray(result.unknown));
  assert.equal(result.evidenceStrength, "MODERATE");
  assert.equal(result.researchPriority, "HIGH");
});

test("TIDES reasoning rejects invalid JSON", () => {
  assert.throws(
    () => parseAgentResponse("not valid json"),
    (error) => {
      assert.equal(error.code, "AGENT_INVALID_JSON");
      return true;
    },
  );
});