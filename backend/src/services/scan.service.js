import { watchlistStore } from '../state/watchlist.store.js';
import { getOverview, getDailyHistory, getPeers } from '../integration/sectors.client.js';
import { normalizeOverview, normalizeDailyHistory, normalizePeers } from './sectors-normalizer.service.js';
import { runSignalEngine } from './signal-engine.service.js';

let lastScanResult = null;

function toSectorsSymbol(ticker) {
  // Symbol di watchlist store disimpan uppercase tanpa .JK (mis. "BBCA")
  // Sectors path juga pakai tanpa .JK — jadi tidak perlu strip apa pun saat ini.
  return ticker;
}

function getDateRange(days = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}

export async function runScan() {
  const watchlist = watchlistStore.getAll();
  const allSignals = [];
  const errors = [];

  const { start, end } = getDateRange(30);

  for (const { symbol } of watchlist) {
    const sectorsSymbol = toSectorsSymbol(symbol);
    try {
      const [overviewRaw, historyRaw, peersRaw] = await Promise.all([
        getOverview(sectorsSymbol),
        getDailyHistory(sectorsSymbol, start, end),
        getPeers(sectorsSymbol),
      ]);

      const current = normalizeOverview(overviewRaw);
      const history = normalizeDailyHistory(historyRaw);
      const peers = normalizePeers(peersRaw);

      const signals = runSignalEngine(symbol, current, history, peers);
      allSignals.push(...signals);
    } catch (err) {
      errors.push({ symbol, message: err.message, code: err.code || 'INTERNAL_ERROR' });
    }
  }

  lastScanResult = {
    scanned_at: new Date().toISOString(),
    symbols_scanned: watchlist.length,
    signals_detected: allSignals.length,
    queue: allSignals,
    errors,
  };

  return lastScanResult;
}

export function getLastSignals() {
  return lastScanResult?.queue || [];
}