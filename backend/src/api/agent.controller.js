import { runAgent } from '../integration/agent.client.js';
import { buildEvidenceBrief } from '../services/evidence.service.js';
import { getOverview } from '../integration/sectors.client.js';
import { normalizeOverview } from '../services/sectors-normalizer.service.js';
import { normalizeTicker } from '../utils/ticker.js';

export async function investigateSignal(req, res, next) {
  try {
    // ── Validasi input ────────────────────────────────────────────────────────
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Request body must be a JSON object' },
      });
    }

    // Terima ticker (nama baru) maupun symbol (kompatibilitas mundur).
    const rawTicker = req.body.ticker ?? req.body.symbol;
    if (typeof rawTicker !== 'string' || !rawTicker.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "Field 'ticker' must be a non-empty string" },
      });
    }

    const ticker = normalizeTicker(rawTicker);
    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid ticker format: '${rawTicker}'` },
      });
    }

    // ── Auto-Enrichment dari live API ────────────────────────────────────────
    let payload = { ...req.body, ticker };

    const needsEnrichment = !payload.signal || !payload.currentContext;
    if (needsEnrichment) {
      const rawOverview = await getOverview(ticker);
      const current = normalizeOverview(rawOverview);

      if (!payload.currentContext) {
        const dailyChangePercent = current.daily_price_change !== null 
          ? Number((current.daily_price_change * 100).toFixed(2)) 
          : 0;
          
        payload.currentContext = {
          currentPrice: current.price,
          dailyChange: dailyChangePercent,
          latestDate: current.price_date,
          sector: current.sector,
          industry: current.industry
        };
      }

      if (!payload.signal) {
        const dailyChange = payload.currentContext.dailyChange;
        payload.signal = {
          type: 'PRICE_MOVEMENT',
          priority: 'HIGH',
          description: 'Price movement requires further investigation.',
          details: {
            direction: dailyChange >= 0 ? 'UP' : 'DOWN',
            magnitude: Math.abs(dailyChange)
          }
        };
      }

      if (!payload.availableTools) {
        payload.availableTools = ["getOverview", "getHistorical", "getPeers"];
      }
    }

    // ── Panggil AI Agent ──────────────────────────────────────────────────────
    const result = await runAgent(payload);
    const evidenceBrief = buildEvidenceBrief(result);

    res.json({
      success: true,
      data: evidenceBrief,
    });
  } catch (err) {
    next(err);
  }
}