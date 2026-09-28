import type { ResearchPriority } from '../types/priority'
import type { ScanResult, Signal } from '../types/signal'
import type { WatchlistItem } from '../types/watchlist'
import type { TidesApi } from './tidesApi'

// Backend belum pakai auth: watchlist masih global in-memory, jadi tidak ada header token.
// Semua mapping bentuk backend (envelope { success, data }, field symbol/added_at) berhenti di file ini.

type Envelope<T> = { success: true; data: T } | { success: false; error?: { code?: string; message?: string } }

interface BackendWatchlistEntry {
  symbol: string
  added_at: string
}

// POST /api/scan dan GET /api/signals: amplop { success, data } dan bentuk response scan dikonfirmasi dari tes langsung.
interface BackendScanResponse {
  scanned_at: string
  // Opsional: errors hanya pernah terlihat di response gagal, belum tahu apakah selalu ada saat scan sukses.
  errors?: { code: string; message: string; symbol: string }[]
}

// Bentuk signal dibaca dari signal-engine.service.js, BELUM diverifikasi lawan response sukses: backend jalan,
// tapi Sectors API belum bisa diakses dari environment tes, jadi scan selalu berakhir SECTORS_UNAVAILABLE.
interface BackendSignal {
  ticker: string
  type: string // contoh: "PRICE_CHANGE"
  magnitude: string // sudah string jadi dengan unit, contoh: "5.20%", "2.3x average"
}

// Dari backend: ticker, reason (gabungan type + magnitude apa adanya).
// Placeholder frontend: detectedAt = scanned_at (backend tidak kirim timestamp per signal), priority = MEDIUM untuk
// semua (backend belum menghitung prioritas, gap produk yang sudah dikabari ke Agent/AI Lead, bukan bug frontend).
const PLACEHOLDER_PRIORITY: ResearchPriority = 'MEDIUM'

const toSignal = (signal: BackendSignal, scannedAt: string): Signal => ({
  ticker: signal.ticker,
  priority: PLACEHOLDER_PRIORITY,
  reason: `${signal.type} ${signal.magnitude}`,
  detectedAt: scannedAt,
})

function notImplemented(method: string): Error {
  return new Error(`httpTidesApi not implemented: ${method}`)
}

const toWatchlistItem = (entry: BackendWatchlistEntry): WatchlistItem => ({
  ticker: entry.symbol,
  addedAt: entry.added_at,
})

export function createHttpTidesApi(baseUrl = ''): TidesApi {
  const root = `${baseUrl.replace(/\/+$/, '')}/api`

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${root}${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new Error("Can't reach the TIDES server. Check that the backend is running.")
    }

    const envelope = (await response.json().catch(() => null)) as Envelope<T> | null
    if (envelope?.success === true && response.ok) return envelope.data
    const message = envelope?.success === false ? envelope.error?.message : undefined
    throw new Error(message || `The server responded with an error (${response.status}).`)
  }

  return {
    async getWatchlist() {
      const data = await request<{ watchlist: BackendWatchlistEntry[] }>('GET', '/watchlist')
      return data.watchlist.map(toWatchlistItem)
    },
    async addTicker(ticker) {
      await request('POST', '/watchlist', { symbol: ticker })
    },
    async removeTicker(ticker) {
      await request('DELETE', `/watchlist/${encodeURIComponent(ticker)}`)
    },
    async scanWatchlist(): Promise<ScanResult> {
      const scan = await request<BackendScanResponse>('POST', '/scan')
      const { signals } = await request<{ signals: BackendSignal[] }>('GET', '/signals')
      const errors = scan.errors ?? []

      // Semua ticker gagal: lempar supaya layar tampil gagal, bukan antrean kosong yang terlihat "aman".
      if (errors.length > 0 && signals.length === 0) throw new Error(errors[0].message)
      // Gagal sebagian: ScanResult tidak punya tempat untuk error, jadi cukup dicatat di console.
      if (errors.length > 0) console.warn('Scan partially failed for some tickers:', errors)

      return { scannedAt: scan.scanned_at, signals: signals.map((signal) => toSignal(signal, scan.scanned_at)) }
    },
    async investigate() {
      throw notImplemented('investigate')
    },
    async challenge() {
      throw notImplemented('challenge')
    },
  }
}

export const httpTidesApi = createHttpTidesApi(import.meta.env.VITE_API_BASE_URL)
