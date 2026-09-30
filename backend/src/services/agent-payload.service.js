// backend/src/services/agent-payload.service.js
/**
 * List of tools that the AI Agent can use. Must stay static.
 */
export const AVAILABLE_TOOLS = ["getOverview", "getHistorical", "getPeers"];

/**
 * Build the `currentContext` object for the response payload.
 * Accepts either a normalized overview object (fields: price, daily_price_change, price_date, sector, industry)
 * or a pre‑built currentContext object (fields: currentPrice, dailyChange, latestDate, sector, industry).
 * Returns an object with fields:
 *   - currentPrice
 *   - dailyChange (percent number)
 *   - latestDate
 *   - sector
 *   - industry
 */
import { toPercent } from "../utils/format.js";
export function buildCurrentContext(current) {
  if (!current) return null;
  // If already in target shape, just return it (ensuring dailyChange is number)
  if ("currentPrice" in current && "dailyChange" in current) {
    return {
      currentPrice: current.currentPrice,
      dailyChange: Number(current.dailyChange),
      latestDate: current.latestDate,
      sector: current.sector,
      industry: current.industry,
    };
  }
  // Otherwise assume normalized overview shape
  const {
    price,
    daily_price_change,
    price_date,
    sector,
    industry,
  } = current;
  return {
    currentPrice: price,
    dailyChange: toPercent(daily_price_change),
    latestDate: price_date,
    sector,
    industry,
  };
}

/**
 * Assemble the final payload sent back to the caller.
 */
export function buildAgentPayload(ticker, signal, current) {
  return {
    ticker,
    signal,
    currentContext: buildCurrentContext(current),
    availableTools: AVAILABLE_TOOLS,
  };
}
