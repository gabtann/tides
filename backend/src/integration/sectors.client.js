import { config } from '../config/env.js';

/**
 * Wrapper untuk semua komunikasi ke Sectors REST API v2.
 * Satu-satunya file yang tahu detail URL, auth header, dan format response asli Sectors.
 * Referensi: docs/sectors-data.md
 */

async function sectorsFetch(path) {
  const url = `${config.sectorsBaseUrl}${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': config.sectorsApiKey, // Dikonfirmasi Data Lead: raw API key, TANPA prefix "Bearer"
      },
    });
  } catch (networkErr) {
    const err = new Error('Failed to reach Sectors API');
    err.status = 502;
    err.code = 'SECTORS_UNAVAILABLE';
    throw err;
  }

  if (response.status === 404) {
    const err = new Error('Symbol not found on Sectors');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (response.status === 401) {
    const err = new Error('Invalid Sectors API key');
    err.status = 502;
    err.code = 'SECTORS_UNAVAILABLE';
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`Sectors API returned ${response.status}`);
    err.status = 502;
    err.code = 'SECTORS_UNAVAILABLE';
    throw err;
  }

  return response.json();
}

/**
 * Company Overview — harga terkini, klasifikasi, market cap.
 * symbol TANPA .JK (mis. "BBCA"), sesuai dokumentasi Sectors.
 */
export async function getOverview(symbol) {
  return sectorsFetch(`/v2/company/report/${symbol}/?sections=overview`);
}

/**
 * Daily historical data untuk range tanggal tertentu.
 * Sectors membatasi range secara diam-diam (lihat docs bagian 18.4) —
 * jangan asumsikan semua tanggal yang diminta pasti ada di response.
 */
export async function getDailyHistory(symbol, startDate, endDate) {
  return sectorsFetch(`/v2/daily/${symbol}/?start=${startDate}&end=${endDate}`);
}

/**
 * Peer comparison data.
 * Peer list berasal dari response Sectors — JANGAN di-hardcode.
 */
export async function getPeers(symbol) {
  return sectorsFetch(`/v2/company/report/${symbol}/?sections=peers`);
}