/**
 * Signal Engine — mendeteksi signal HANYA dari data yang benar-benar tersedia
 * (lihat docs/sectors-data.md bagian 20, Priority 1: Market Data).
 * Threshold di bawah ini BELUM final dari Sectors/tim — placeholder awal yang wajib
 * dikalibrasi ulang dengan data real sebelum dipakai serius (lihat bagian 19.5).
 * Tidak ada scoring/ranking gabungan — tiap detector berdiri sendiri, hasilnya
 * daftar signal mentah, bukan skor tunggal.
 */

const PRICE_CHANGE_THRESHOLD = 0.05; // 5%, dalam desimal sesuai format daily_price_change
const VOLUME_MULTIPLIER_THRESHOLD = 2; // volume hari ini >= 2x rata-rata N hari

/**
 * current: hasil normalizeOverview()
 */
export function detectPriceMovement(current) {
  // Tambahan guard !current untuk mencegah crash jika objek current undefined
  if (!current || current.daily_price_change === null) return null;
  if (Math.abs(current.daily_price_change) < PRICE_CHANGE_THRESHOLD) return null;

  return {
    type: 'PRICE_CHANGE',
    direction: current.daily_price_change > 0 ? 'UP' : 'DOWN', // Tambahan UX untuk AI/Frontend
    magnitude: `${(current.daily_price_change * 100).toFixed(2)}%`,
    raw_value: current.daily_price_change,
  };
}

/**
 * history: array hasil normalizeDailyHistory(), diurutkan dari lama ke baru
 */
export function detectVolumeMovement(history) {
  if (!history || history.length < 2) return null;

  const latest = history[history.length - 1];
  const previous = history.slice(0, -1);

  const validVolumes = previous.map((d) => d.volume).filter((v) => v !== null);
  if (validVolumes.length === 0 || latest.volume === null) return null;

  const avgVolume = validVolumes.reduce((a, b) => a + b, 0) / validVolumes.length;
  if (avgVolume === 0) return null;

  const ratio = latest.volume / avgVolume;
  if (ratio < VOLUME_MULTIPLIER_THRESHOLD) return null;

  return {
    type: 'VOLUME_SPIKE',
    magnitude: `${ratio.toFixed(1)}x average`,
    raw_value: ratio,
  };
}

/**
 * current: hasil normalizeOverview() — pakai 90-day high/low yang memang disediakan Sectors
 */
export function detectHistoricalDeviation(current) {
  // Tambahan guard !current di sini juga
  if (!current || current.ninety_day_high === null || current.ninety_day_low === null || current.price === null) {
    return null;
  }

  const range = current.ninety_day_high - current.ninety_day_low;
  if (range <= 0) return null;

  const positionInRange = (current.price - current.ninety_day_low) / range;

  if (positionInRange >= 0.95) {
    return { type: 'NEAR_90D_HIGH', magnitude: `${(positionInRange * 100).toFixed(1)}% of 90d range` };
  }
  if (positionInRange <= 0.05) {
    return { type: 'NEAR_90D_LOW', magnitude: `${(positionInRange * 100).toFixed(1)}% of 90d range` };
  }
  return null;
}

/**
 * current: hasil normalizeOverview() untuk symbol utama
 * peers: hasil normalizePeers()
 *
 * DIMATIKAN SEMENTARA (dikonfirmasi Data Lead 2026-09-25):
 * Peer endpoint hanya menyediakan yearly_mcap_chg (perubahan tahunan),
 * sementara data symbol utama yang tersedia adalah daily_price_change (harian).
 * Membandingkan dua satuan waktu berbeda tidak valid secara matematis.
 *
 * Untuk mengaktifkan fitur ini dengan benar, perlu panggil Daily API
 * (getDailyHistory) untuk MASING-MASING peer juga, lalu hitung daily change
 * per peer dengan cara yang sama seperti symbol utama — baru dibandingkan apple-to-apple.
 * Ini menambah jumlah API call signifikan per scan (1 symbol utama + N peer x Daily API),
 * jadi perlu dipertimbangkan dampaknya ke rate limit sebelum diimplementasi.
 */
export function detectPeerDivergence(current, peers) {
  return null; // TODO: implementasi setelah ada keputusan soal cost API call tambahan
}

export function runSignalEngine(ticker, normalizedCurrent, normalizedHistory, normalizedPeers) {
  const signals = [];

  const priceSignal = detectPriceMovement(normalizedCurrent);
  if (priceSignal) signals.push({ ticker, ...priceSignal });

  const volumeSignal = detectVolumeMovement(normalizedHistory);
  if (volumeSignal) signals.push({ ticker, ...volumeSignal });

  const deviationSignal = detectHistoricalDeviation(normalizedCurrent);
  if (deviationSignal) signals.push({ ticker, ...deviationSignal });

  const peerSignal = detectPeerDivergence(normalizedCurrent, normalizedPeers);
  if (peerSignal) signals.push({ ticker, ...peerSignal });

  return signals;
}