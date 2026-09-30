import { getOverview, getDailyHistory, getPeers } from "../integration/sectors.client.js";
import {
  normalizeOverview,
  normalizeDailyHistory,
  normalizePeers,
} from "./sectors-normalizer.service.js";

export async function executeAgentTool(toolName, ticker, options = {}) {
  switch (toolName) {
    case "getOverview": {
      const raw = await getOverview(ticker);
      return normalizeOverview(raw);
    }

    case "getHistorical": {
      const raw = await getDailyHistory(
        ticker,
        options.startDate,
        options.endDate,
      );
      return normalizeDailyHistory(raw);
    }

    case "getPeers": {
      const raw = await getPeers(ticker);
      return normalizePeers(raw, ticker);
    }

    default: {
      const error = new Error(`Unknown agent tool: ${toolName}`);
      error.code = "UNKNOWN_AGENT_TOOL";
      throw error;
    }
  }
}