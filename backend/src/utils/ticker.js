/**
 * Ticker utility — TIDES internal ticker normalization.
 *
 * ATURAN FORMAT TICKER INTERNAL TIDES:
 * - Selalu uppercase.
 * - Tanpa suffix ".JK".
 * - Contoh: "BBCA.JK" → "BBCA", "bbca" → "BBCA".
 *
 * File ini adalah SATU-SATUNYA tempat yang boleh mengandung logika strip ".JK".
 * File lain WAJIB import dari sini — dilarang menulis .replace('.JK', '') secara langsung.
 */

/**
 * Konversi ticker apa pun ke format internal TIDES: uppercase, tanpa ".JK".
 * - Input dengan ".JK" (besar/kecil): strip suffix, lalu uppercase.
 * - Input tanpa ".JK": uppercase saja.
 * - Input bukan string atau string kosong: kembalikan null.
 *
 * @param {*} ticker
 * @returns {string|null}
 */
export function normalizeTicker(ticker) {
  if (typeof ticker !== 'string' || ticker.trim() === '') return null;
  return ticker.trim().toUpperCase().replace(/\.JK$/i, '');
}

/**
 * Konversi ticker ke format yang dipakai sebagai path segment di URL Sectors API.
 * Saat ini Sectors menerima symbol TANPA ".JK" (dikonfirmasi dari docs/sectors-data.md).
 *
 * Fungsi ini sengaja dipisah dari normalizeTicker() karena punya maksud yang berbeda:
 * normalizeTicker = konvensi penyimpanan internal TIDES.
 * toSectorsSymbol = konvensi path URL ke Sectors API.
 * Jika aturan path Sectors berubah di masa depan (misal butuh suffix ".JK"),
 * cukup ubah fungsi ini tanpa mengubah cara TIDES menyimpan data secara internal.
 *
 * @param {*} ticker
 * @returns {string|null}
 */
export function toSectorsSymbol(ticker) {
  return normalizeTicker(ticker);
}
