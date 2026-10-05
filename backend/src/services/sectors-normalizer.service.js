/**
 * Normalizer: mengubah raw response Sectors menjadi TIDES Internal Schema.
 * Referensi: docs/sectors-data.md + JSON mentah hasil technical spike (2026-09-25).
 *
 * CATATAN PENTING soal struktur asli Sectors (dikonfirmasi dari raw JSON):
 * - Overview: field ada di dalam raw.overview.*, BUKAN di root (kecuali symbol & company_name)
 * - 90-day high/low: bentuknya object berkunci tanggal, mis. { "2026-08-19": 18650 },
 *   BUKAN angka langsung — perlu ekstraksi value-nya
 * - Peers: raw.peers adalah ARRAY berisi satu object, path lengkapnya
 *   raw.peers[0].peers_data.companies
 */

import { normalizeTicker } from '../utils/ticker.js';

/**
 * Ambil satu-satunya value dari object berkunci tanggal, mis. { "2026-08-19": 18650 } -> 18650
 * Dipakai untuk all_time_price.90_d_high / 90_d_low yang kuncinya tanggal dinamis.
 */
function extractDatedValue(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const values = Object.values(obj);
  return values.length > 0 ? values[0] : null;
}

/**
 * Ubah overview response Sectors → TIDES internal current data.
 * Field ticker menggunakan normalizeTicker() — tanpa .JK, selalu uppercase.
 */
export function normalizeOverview(raw) {
  const overview = raw?.overview ?? {};

  return {
    ticker: normalizeTicker(raw?.symbol),
    company_name: raw?.company_name ?? null,
    price: overview?.last_close_price ?? null,
    price_date: overview?.latest_close_date ?? null,
    daily_price_change: overview?.daily_close_change ?? null,
    market_cap: overview?.market_cap ?? null,
    sector: overview?.sector ?? null,
    sub_sector: overview?.sub_sector ?? null,
    industry: overview?.industry ?? null,
    sub_industry: overview?.sub_industry ?? null,
    ninety_day_high: extractDatedValue(overview?.all_time_price?.['90_d_high']),
    ninety_day_low: extractDatedValue(overview?.all_time_price?.['90_d_low']),
  };
}

/**
 * Ubah daily history response Sectors (array di root) → TIDES internal historical records.
 * Field ticker tiap item menggunakan normalizeTicker() — tanpa .JK.
 */
export function normalizeDailyHistory(rawArray) {
  if (!Array.isArray(rawArray)) return [];
  return rawArray.map((r) => ({
    ticker: normalizeTicker(r?.symbol),
    date: r?.date ?? null,
    open: r?.open ?? null,
    high: r?.high ?? null,
    low: r?.low ?? null,
    close: r?.close ?? null,
    volume: r?.volume ?? null,
    market_cap: r?.market_cap ?? null,
  }));
}

/**
 * Ubah peers response Sectors → TIDES internal peer data.
 * Struktur asli: raw.peers adalah ARRAY (biasanya 1 item), path lengkap:
 * raw.peers[0].peers_data.companies[]
 *
 * @param {object} raw       - Raw response dari Sectors API
 * @param {string} queryTicker - Ticker yang sedang di-query (format apa pun).
 *   Dipakai untuk memfilter self-peer: perusahaan itu sendiri tidak boleh muncul
 *   sebagai peer dari dirinya sendiri.
 */
export function normalizePeers(raw, queryTicker) {
  const companies = raw?.peers?.[0]?.peers_data?.companies ?? [];
  const selfTicker = normalizeTicker(queryTicker);

  if (!Array.isArray(companies)) return [];

  return companies
    .map((p) => ({
      ticker: normalizeTicker(p?.symbol),
      market_cap: p?.market_cap ?? null,
      pb: p?.pb_mrq ?? null,
      pe: p?.pe_ttm ?? null,
      yearly_mcap_change: p?.yearly_mcap_chg ?? null,
    }))
    .filter((p) => p.ticker !== selfTicker);
}