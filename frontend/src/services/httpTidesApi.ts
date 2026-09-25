import type { TidesApi } from './tidesApi'

// Diisi tim backend: fetch ke VITE_API_BASE_URL, lampirkan token sesi, mapping field ke tipe di src/types,
// dan ubah error jaringan/HTTP menjadi Error dengan message yang layak ditampilkan ke user.
function notImplemented(method: string): Error {
  return new Error(`httpTidesApi not implemented: ${method}`)
}

export const httpTidesApi: TidesApi = {
  async getWatchlist() {
    throw notImplemented('getWatchlist')
  },
  async addTicker() {
    throw notImplemented('addTicker')
  },
  async removeTicker() {
    throw notImplemented('removeTicker')
  },
  async scanWatchlist() {
    throw notImplemented('scanWatchlist')
  },
  async investigate() {
    throw notImplemented('investigate')
  },
  async challenge() {
    throw notImplemented('challenge')
  },
}
