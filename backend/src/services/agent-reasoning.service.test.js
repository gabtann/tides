import test from "node:test";
import assert from "node:assert/strict";
import { parseAgentResponse } from "./agent-reasoning.service.js";

function validAgentResponse(overrides = {}) {
  return JSON.stringify({
    ticker: "BBCA",
    signal: "Price movement requires further investigation.",
    observed: ["BBCA price increased by 6.2%."],
    compared: ["Peer average change was 1.1%."],
    interpreted: [
      "The price movement was materially larger than the peer average.",
    ],
    unknown: [
      "The available evidence does not establish the cause of the movement.",
    ],
    evidenceStrength: "MODERATE",
    researchPriority: "HIGH",
    limitation: "Causal explanation requires additional evidence.",
    ...overrides,
  });
}

test("TIDES reasoning parses valid complete JSON", () => {
  const response = validAgentResponse();
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

test("TIDES reasoning rejects valid JSON with a missing required field", () => {
  const response = JSON.parse(validAgentResponse());
  delete response.compared;

  assert.throws(
    () => parseAgentResponse(JSON.stringify(response)),
    (error) => {
      assert.equal(error.code, "AGENT_INVALID_OUTPUT");
      return true;
    },
  );
});

test("TIDES reasoning rejects valid JSON with a field of the wrong type", () => {
  assert.throws(
    () => parseAgentResponse(validAgentResponse({ observed: "not an array" })),
    (error) => {
      assert.equal(error.code, "AGENT_INVALID_OUTPUT");
      return true;
    },
  );
});

test("TIDES reasoning accepts valid JSON with null limitation", () => {
  const result = parseAgentResponse(validAgentResponse({ limitation: null }));

  assert.equal(result.limitation, null);
});

test("TIDES reasoning rejects array and null root values", () => {
  for (const response of ["[]", "null"]) {
    assert.throws(
      () => parseAgentResponse(response),
      (error) => {
        assert.equal(error.code, "AGENT_INVALID_OUTPUT");
        return true;
      },
    );
  }
});