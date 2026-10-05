// backend/src/services/agent-orchestrator.service.js

import { executeAgentTool } from "./agent-tools.service.js";
import { reasonAboutEvidence } from "./agent-reasoning.service.js";
import { buildEvidenceBrief } from "./evidence.service.js";

const TOOL_MAP = {
  PRICE_MOVEMENT: ["getHistorical", "getPeers"],
  VOLUME_MOVEMENT: ["getHistorical", "getPeers"],
  HISTORICAL_DEVIATION: ["getHistorical", "getPeers"],
  PEER_DIVERGENCE: ["getPeers", "getHistorical"],
};

export async function investigateWithAgent(input, dependencies = {}) {
    const runReasoning =
        dependencies.reasonAboutEvidence ?? reasonAboutEvidence;

    const buildBrief =
        dependencies.buildEvidenceBrief ?? buildEvidenceBrief;

  const signalType = input?.signal?.type;
  const selectedTools = TOOL_MAP[signalType];

  if (!selectedTools) {
    const error = new Error(`Unsupported signal type: ${signalType}`);
    error.code = "UNSUPPORTED_SIGNAL_TYPE";
    throw error;
  }

  const evidence = {};

  for (const toolName of selectedTools) {
    const options =
      toolName === "getHistorical"
        ? {
            startDate: "2026-09-01",
            endDate: "2026-09-30",
          }
        : {};

    evidence[toolName] = await executeAgentTool(
      toolName,
      input.ticker,
      options,
    );
  }

  const reasoningResult = await runReasoning(input, evidence);
  const evidenceBrief = buildBrief(reasoningResult);
  
  return {
    input,
    selectedTools,
    evidence,
    evidenceBrief,
  };
}