/**
 * Normalizer: mengubah raw response Sectors menjadi TIDES Internal Schema.
 * Signal engine TIDAK BOLEH bergantung langsung ke struktur response Sectors —
 * kalau Sectors ubah field, cukup ubah file ini, bukan signal-engine.service.js.
 * Referensi: docs/sectors-data.md bagian 17.
 */

/**
 * Ubah overview response Sectors → TIDES internal current data.
 */
export function normalizeOverview(raw) {
  return {
    ticker: raw.symbol ?? null,
    company_name: raw.company_name ?? null,
    price: raw.last_close_price ?? null,
    price_date: raw.latest_close_date ?? null,
    daily_price_change: raw.daily_close_change ?? null,
    market_cap: raw.market_cap ?? null,
    sector: raw.sector ?? null,
    sub_sector: raw.sub_sector ?? null,
    industry: raw.industry ?? null,
    ninety_day_high: raw.all_time_price?.['90_d_high'] ?? null,
    ninety_day_low: raw.all_time_price?.['90_d_low'] ?? null,
  };
}

/**
 * Ubah daily history response Sectors (array) → TIDES internal historical records.
 */
export function normalizeDailyHistory(rawArray) {
  if (!Array.isArray(rawArray)) return [];
  return rawArray.map((r) => ({
    ticker: r.symbol ?? null,
    date: r.date ?? null,
    open: r.open ?? null,
    high: r.high ?? null,
    low: r.low ?? null,
    close: r.close ?? null,
    volume: r.volume ?? null,
    market_cap: r.market_cap ?? null,
  }));
}

/**
 * Ubah peers response Sectors → TIDES internal peer data.
 * Struktur asli Sectors: { peers: { peers_data: { companies: [...] } } }
 * Dikonfirmasi Data Lead 2026-09-25.
 */
export function normalizePeers(raw) {
  const companies = raw?.peers?.peers_data?.companies ?? [];
  return companies.map((p) => ({
    ticker: p.symbol ?? null,
    market_cap: p.market_cap ?? null,
    pb: p.pb_mrq ?? null,
    pe: p.pe_ttm ?? null,
    yearly_mcap_change: p.yearly_mcap_chg ?? null,
  }));
}