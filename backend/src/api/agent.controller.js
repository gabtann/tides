import { runAgent } from '../integration/agent.client.js';
import { buildEvidenceBrief } from '../services/evidence.service.js';
import { getLastSignals } from '../services/scan.service.js';
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

    // ── Auto-Enrichment dari last scan ────────────────────────────────────────
    // Jika client hanya mengirim { ticker } tanpa signal / currentContext,
    // cari di hasil scan terakhir dan lengkapi payload secara otomatis.
    // Ini memungkinkan Frontend memanggil endpoint dengan payload minimal.
    let payload = { ...req.body, ticker };

    const needsEnrichment = !payload.signal || !payload.currentContext;
    if (needsEnrichment) {
      const lastSignals = getLastSignals();
      // Cari semua signal untuk ticker ini (bisa > 1 signal per ticker)
      const signals = lastSignals.filter((s) => s.ticker === ticker);

      if (signals.length > 0) {
        // Pakai signal pertama yang ditemukan; currentContext sama untuk semua signal satu ticker
        const first = signals[0];

        if (!payload.signal) {
          payload.signal = {
            type: first.type,
            direction: first.direction,
            magnitude: first.magnitude,
            // Jika ada banyak signal, sertakan sebagai daftar untuk konteks agent
            allSignals: signals.map((s) => ({ type: s.type, direction: s.direction, magnitude: s.magnitude })),
          };
        }

        if (!payload.currentContext && first.currentContext) {
          payload.currentContext = first.currentContext;
        }

        if (!payload.availableTools && first.availableTools) {
          payload.availableTools = first.availableTools;
        }
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