import { watchlistStore } from '../state/watchlist.store.js';
import { getOverview, getDailyHistory, getPeers } from '../integration/sectors.client.js';
import { normalizeOverview, normalizeDailyHistory, normalizePeers } from './sectors-normalizer.service.js';
import { runSignalEngine } from './signal-engine.service.js';
import { normalizeTicker } from '../utils/ticker.js';

let lastScanResult = null;

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
    // Normalisasi ticker dari watchlist sebelum dipakai ke API maupun ke normalizer.
    // Watchlist menyimpan ticker tanpa .JK (mis. "BBCA"), normalizeTicker() memastikan
    // format konsisten meski ada edge case huruf kecil atau sufx dari sumber lain.
    const ticker = normalizeTicker(symbol);

    try {
      const [overviewRaw, historyRaw, peersRaw] = await Promise.all([
        getOverview(ticker),
        getDailyHistory(ticker, start, end),
        getPeers(ticker),
      ]);

      const current = normalizeOverview(overviewRaw);
      const history = normalizeDailyHistory(historyRaw);
      // normalizePeers sekarang butuh parameter kedua (ticker yang di-query)
      // untuk memfilter self-peer dari hasil.
      const peers = normalizePeers(peersRaw, ticker);

      const signals = runSignalEngine(ticker, current, history, peers);

      const agentSignals = signals.map((signal) => ({
        ...signal,
        currentContext: {
          currentPrice: current.price,
          dailyChange: current.daily_price_change,
          latestDate: current.latest_close_date,
          sector: current.sector,
          industry: current.industry,
        },
        availableTools: [
          'getOverview',
          'getHistorical',
          'getPeers',
          'getValuation',
          'getFundamentals',
        ],
      }));

      allSignals.push(...agentSignals);
    } catch (err) {
      const isExternal = (err.code && err.code.startsWith('SECTORS_')) || err.status >= 500;
      errors.push({
        symbol: ticker ?? symbol,
        message: isExternal ? 'An error occurred while communicating with external services' : err.message,
        code: err.code || 'INTERNAL_ERROR',
      });
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