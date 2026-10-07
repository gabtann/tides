// backend/src/services/agent.service.js
/**
 * Investigation service implementing the POST /api/agent/investigate logic.
 * It follows the three cases described in the task specification.
 *
 * Flow: assemble Agent Input payload → send to AI Agent via runAgent() →
 *       normalize response via buildEvidenceBrief() → return Evidence Brief.
 */
import { normalizeTicker } from "../utils/ticker.js";
import { getOverview, getDailyHistory, getPeers } from "../integration/sectors.client.js";
import { normalizeOverview, normalizeDailyHistory, normalizePeers } from "../services/sectors-normalizer.service.js";
import { runSignalEngine } from "./signal-engine.service.js";
import { selectTopSignal } from "../utils/priority.js";
import { buildAgentPayload } from "./agent-payload.service.js";
import { runAgent } from "../integration/agent.client.js";
import { buildEvidenceBrief } from "./evidence.service.js";

export async function investigate(body) {
  // 1. Validate ticker
  const rawTicker = body?.ticker ?? body?.symbol;
  const ticker = normalizeTicker(rawTicker);
  if (!ticker) {
    const err = new Error("Invalid or missing ticker");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Helper to fetch and normalize current context
  const fetchCurrentContext = async () => {
    const overview = await getOverview(ticker);
    const current = normalizeOverview(overview);
    return {
      currentPrice: current.price,
      dailyChange: Number(current.daily_price_change),
      latestDate: current.price_date,
      sector: current.sector,
      industry: current.industry,
    };
  };

  let agentInputPayload;

  // Case 1: both signal and currentContext provided
  if (body.signal && body.currentContext) {
    agentInputPayload = buildAgentPayload(ticker, body.signal, body.currentContext);
  }
  // Case 2: signal present, but currentContext missing → live fetch only currentContext
  else if (body.signal && !body.currentContext) {
    const currentContext = await fetchCurrentContext();
    agentInputPayload = buildAgentPayload(ticker, body.signal, currentContext);
  }
  // Case 3: fallback – no signal supplied
  // Live fetch full data, run signal engine, pick top priority signal
  else {
    const [overview, historyRaw, peersRaw] = await Promise.all([
      getOverview(ticker),
      getDailyHistory(ticker),
      getPeers(ticker),
    ]);
    const normalizedCurrent = normalizeOverview(overview);
    const normalizedHistory = normalizeDailyHistory(historyRaw);
    const normalizedPeers = normalizePeers(peersRaw);

    const signals = runSignalEngine(ticker, normalizedCurrent, normalizedHistory, normalizedPeers);
    const topSignal = selectTopSignal(signals);
    if (!topSignal) {
      const err = new Error("No signal found");
      err.status = 404;
      err.code = "NO_SIGNAL_FOUND";
      throw err;
    }

    const currentContext = await fetchCurrentContext();
    agentInputPayload = buildAgentPayload(ticker, topSignal, currentContext);
  }

  // Send to AI Agent and normalize the response.
  // CP5 fix: Agent now returns a nested object where Evidence Brief lives under
  // the `evidenceBrief` key. Extract it with a safe fallback to the root object
  // so that older flat-format responses remain backward-compatible.
  const agentRawResponse = await runAgent(agentInputPayload);
  const briefData = agentRawResponse?.evidenceBrief || agentRawResponse;
  return buildEvidenceBrief(briefData);
}
