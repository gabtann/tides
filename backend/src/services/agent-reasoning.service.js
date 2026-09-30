// backend/src/services/agent-reasoning.service.js

import { generateText } from "../integration/gemini.client.js";

export function parseAgentResponse(response) {
  let parsed;

  try {
    parsed = JSON.parse(response);
  } catch {
    const error = new Error("Agent returned invalid JSON");
    error.code = "AGENT_INVALID_JSON";
    throw error;
  }

  return parsed;
}

export async function reasonAboutEvidence(input, evidence) {
  const prompt = `
You are TIDES, an AI research agent for stock-market investigation.

Your job is to investigate a detected market signal using only the evidence provided to you.

Rules:
- Do not invent market data.
- Do not make buy, sell, or hold recommendations.
- Do not predict future prices.
- Clearly separate observed facts from interpretation.
- If the evidence is insufficient, say so in "unknown" or "limitation".
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown fences.

Agent input:
${JSON.stringify(input, null, 2)}

Evidence collected from Sectors:
${JSON.stringify(evidence, null, 2)}

Return JSON with exactly these fields:
{
  "ticker": "string",
  "signal": "string",
  "observed": ["string"],
  "compared": ["string"],
  "interpreted": ["string"],
  "unknown": ["string"],
  "evidenceStrength": "STRONG | MODERATE | WEAK",
  "researchPriority": "HIGH | MEDIUM | LOW",
  "limitation": "string or null"
}
`;

  const response = await generateText(prompt);

  return parseAgentResponse(response);
}