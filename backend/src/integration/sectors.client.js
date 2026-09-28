import { config } from '../config/env.js';
import { toSectorsSymbol } from '../utils/ticker.js';

/**
 * Wrapper untuk semua komunikasi ke Sectors REST API v2.
 * Satu-satunya file yang tahu detail URL, auth header, dan format response asli Sectors.
 * Referensi: docs/sectors-data.md
 *
 * Error codes yang dilempar:
 *   SECTORS_TIMEOUT       — request melebihi 8000ms (status 504)
 *   NOT_FOUND             — symbol tidak ditemukan di Sectors (status 404)
 *   SECTORS_BAD_REQUEST   — Sectors mengembalikan 400 (status 400)
 *   SECTORS_AUTH_FAILED   — API key tidak valid / 401 (status 502)
 *   SECTORS_RATE_LIMITED  — rate limit tercapai / 429 (status 429)
 *   SECTORS_SERVER_ERROR  — Sectors 5xx (status 502)
 *   SECTORS_UNREACHABLE   — gagal connect total, bukan timeout (status 502)
 *   SECTORS_UNKNOWN_ERROR — status HTTP tidak terduga (status 502)
 */

const REQUEST_TIMEOUT_MS = 8000;

async function sectorsFetch(path) {
  const url = `${config.sectorsBaseUrl}${path}`;

  // --- Timeout via AbortController ---
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': config.sectorsApiKey, // Dikonfirmasi Data Lead: raw API key, TANPA prefix "Bearer"
      },
    });
  } catch (networkErr) {
    clearTimeout(timeoutId);

    // AbortError berarti timeout dari AbortController di atas
    if (networkErr.name === 'AbortError') {
      const err = new Error('Request to Sectors API timed out');
      err.status = 504;
      err.code = 'SECTORS_TIMEOUT';
      throw err;
    }

    // Kegagalan koneksi lainnya (DNS fail, connection refused, dll.)
    const err = new Error('Failed to reach Sectors API');
    err.status = 502;
    err.code = 'SECTORS_UNREACHABLE';
    throw err;
  }

  clearTimeout(timeoutId);

  // --- Per-status error handling ---
  if (response.status === 404) {
    const err = new Error('Symbol not found on Sectors');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (response.status === 400) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.detail ?? body?.message ?? JSON.stringify(body);
    } catch {
      // body tidak bisa di-parse — abaikan
    }
    const err = new Error(`Sectors API bad request: ${detail || response.statusText}`);
    err.status = 400;
    err.code = 'SECTORS_BAD_REQUEST';
    err.detail = detail;
    throw err;
  }

  if (response.status === 401) {
    const err = new Error('Invalid Sectors API key');
    err.status = 502;
    err.code = 'SECTORS_AUTH_FAILED';
    throw err;
  }

  if (response.status === 429) {
    const err = new Error('Sectors API rate limit reached');
    err.status = 429;
    err.code = 'SECTORS_RATE_LIMITED';
    throw err;
  }

  if (response.status >= 500) {
    const err = new Error(`Sectors API server error: ${response.status}`);
    err.status = 502;
    err.code = 'SECTORS_SERVER_ERROR';
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`Sectors API returned unexpected status ${response.status}`);
    err.status = 502;
    err.code = 'SECTORS_UNKNOWN_ERROR';
    throw err;
  }

  return response.json();
}

function validateAndEncode(symbol) {
  if (!symbol || !/^[A-Z0-9]{1,10}$/.test(symbol)) {
    const err = new Error('Invalid ticker format');
    err.status = 400;
    err.code = 'SECTORS_BAD_REQUEST';
    throw err;
  }
  return encodeURIComponent(symbol);
}

/**
 * Company Overview — harga terkini, klasifikasi, market cap.
 * ticker dalam format apa pun (dengan/tanpa .JK) — akan dinormalisasi ke path Sectors.
 */
export async function getOverview(ticker) {
  const symbol = toSectorsSymbol(ticker);
  const safeSymbol = validateAndEncode(symbol);
  return sectorsFetch(`/v2/company/report/${safeSymbol}/?sections=overview`);
}

/**
 * Daily historical data untuk range tanggal tertentu.
 * Sectors membatasi range secara diam-diam (lihat docs bagian 18.4) —
 * jangan asumsikan semua tanggal yang diminta pasti ada di response.
 */
export async function getDailyHistory(ticker, startDate, endDate) {
  const symbol = toSectorsSymbol(ticker);
  const safeSymbol = validateAndEncode(symbol);
  const safeStart = encodeURIComponent(startDate);
  const safeEnd = encodeURIComponent(endDate);
  return sectorsFetch(`/v2/daily/${safeSymbol}/?start=${safeStart}&end=${safeEnd}`);
}

/**
 * Peer comparison data.
 * Peer list berasal dari response Sectors — JANGAN di-hardcode.
 */
export async function getPeers(ticker) {
  const symbol = toSectorsSymbol(ticker);
  const safeSymbol = validateAndEncode(symbol);
  return sectorsFetch(`/v2/company/report/${safeSymbol}/?sections=peers`);
}