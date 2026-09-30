import test from "node:test";
import assert from "node:assert/strict";
import { investigateWithAgent } from "./agent-orchestrator.service.js";

test("TIDES orchestrator executes tools, reasons over evidence, and builds EvidenceBrief", async () => {
  const input = {
    ticker: "BBCA",
    signal: {
      type: "PRICE_MOVEMENT",
      priority: "HIGH",
      description: "Price movement requires further investigation.",
      details: {
        direction: "UP",
        magnitude: 6.2,
      },
    },
    currentContext: {
      currentPrice: 8500,
      dailyChange: 6.2,
      latestDate: "2026-09-30",
      sector: "Financials",
      industry: "Banks",
    },
    availableTools: [
      "getOverview",
      "getHistorical",
      "getPeers",
    ],
  };

 const result = await investigateWithAgent(input, {
  reasonAboutEvidence: async () => ({
    ticker: "BBCA",
    signal: "Price movement requires further investigation.",
    observed: ["BBCA price increased by 6.2%."],
    compared: ["Peer average change was 1.1%."],
    interpreted: [
      "The price movement was materially larger than the peer average.",
    ],
    unknown: [
      "The cause of the price movement cannot be confirmed from the available evidence.",
    ],
    evidenceStrength: "MODERATE",
    researchPriority: "HIGH",
    limitation: "Causal explanation requires additional evidence.",
  }),
});

  assert.equal(result.input.ticker, "BBCA");

  assert.deepEqual(result.selectedTools, [
    "getHistorical",
    "getPeers",
  ]);

  assert.ok(result.evidence);
  assert.ok("getHistorical" in result.evidence);
  assert.ok("getPeers" in result.evidence);

  assert.ok(result.evidenceBrief);
  assert.equal(result.evidenceBrief.ticker, "BBCA");
  assert.equal(typeof result.evidenceBrief.signal, "string");
  assert.ok(Array.isArray(result.evidenceBrief.observed));
  assert.ok(Array.isArray(result.evidenceBrief.compared));
  assert.ok(Array.isArray(result.evidenceBrief.interpreted));
  assert.ok(Array.isArray(result.evidenceBrief.unknown));
  assert.ok(
    ["STRONG", "MODERATE", "WEAK"].includes(
      result.evidenceBrief.evidenceStrength,
    ),
  );
  assert.ok(
    ["HIGH", "MEDIUM", "LOW"].includes(
      result.evidenceBrief.researchPriority,
    ),
  );

  console.log("\nSelected tools:");
  console.log(result.selectedTools);

  console.log("\nSectors evidence:");
  console.dir(result.evidence, { depth: null });

  console.log("\nEvidence Brief:");
  console.dir(result.evidenceBrief, { depth: null });
});