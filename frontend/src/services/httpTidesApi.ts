import type { ResearchPriority } from '../types/priority'
import type { ScanResult, Signal } from '../types/signal'
import type { WatchlistItem } from '../types/watchlist'
import { PRIORITY_ORDER } from '../utils/queue'
import { createMockTidesApi } from './mockTidesApi'
import type { TidesApi } from './tidesApi'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

const NETWORK_ERROR_MESSAGE = 'The TIDES service could not be reached. Please check your internet connection and try again.'
// Semua response backend dibungkus { success, data } atau { success: false, error: { code, message } }.
type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }

export class ApiError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
// Satu-satunya tempat yang memanggil fetch: unwrap envelope, ubah semua kegagalan jadi ApiError.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR')
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null
  if (!body) throw new ApiError(NETWORK_ERROR_MESSAGE, response.status, 'BAD_RESPONSE')
  if (!body.success) throw new ApiError(body.error.message, response.status, body.error.code)
  return body.data
}

interface BackendWatchlistEntry {
  symbol: string
  added_at: string
}

export function toWatchlistItem(entry: BackendWatchlistEntry): WatchlistItem {
  return { ticker: entry.symbol, addedAt: entry.added_at }
}

interface BackendSignal {
  ticker: string
  type: string // PRICE_CHANGE | VOLUME_SPIKE | NEAR_90D_HIGH | NEAR_90D_LOW
  direction?: 'UP' | 'DOWN'
  magnitude: string
}

interface BackendScanResult {
  scanned_at: string
  queue: BackendSignal[]
  errors: { symbol: string; message: string; code: string }[]
}

// SEMENTARA sampai P0 diputuskan: backend belum mengirim priority dan reason.
const SIGNAL_PRIORITY: Record<string, ResearchPriority> = {
  PRICE_CHANGE: 'MEDIUM',
  VOLUME_SPIKE: 'MEDIUM',
  NEAR_90D_HIGH: 'LOW',
  NEAR_90D_LOW: 'LOW',
}

function describeSignal(signal: BackendSignal): string {
  switch (signal.type) {
    case 'PRICE_CHANGE':
      return `Price moved ${signal.magnitude} in one day`
    case 'VOLUME_SPIKE':
      return `Volume at ${signal.magnitude}`
    case 'NEAR_90D_HIGH':
      return `Near 90-day high (${signal.magnitude})`
    case 'NEAR_90D_LOW':
      return `Near 90-day low (${signal.magnitude})`
    default:
      return signal.type
  }
}

// Beberapa signal di satu ticker berarti pergerakan yang saling menguatkan, jadi dinaikkan ke HIGH.
function priorityFor(group: BackendSignal[]): ResearchPriority {
  if (group.length > 1) return 'HIGH'
  const own = group.map((signal) => SIGNAL_PRIORITY[signal.type] ?? 'LOW')
  return PRIORITY_ORDER.find((priority) => own.includes(priority)) ?? 'LOW'
}

// Backend bisa mengirim beberapa signal untuk satu ticker; frontend memakai satu Signal per ticker.
export function toScanResult(raw: BackendScanResult): ScanResult {
  const byTicker = new Map<string, BackendSignal[]>()
  for (const signal of raw.queue) {
    byTicker.set(signal.ticker, [...(byTicker.get(signal.ticker) ?? []), signal])
  }

  const signals = [...byTicker].map(
    ([ticker, group]): Signal => ({
      ticker,
      priority: priorityFor(group),
      reason: group.map(describeSignal).join(' · '),
      detectedAt: raw.scanned_at,
    }),
  )

  return {
    scannedAt: raw.scanned_at,
    signals,
    errors: raw.errors.map((error) => ({ ticker: error.symbol, message: error.message })),
  }
}

// Backend belum punya /investigate dan /challenge (K7), jadi sementara dipinjam dari mock.
const notYetInBackend = createMockTidesApi()

export const httpTidesApi: TidesApi = {
  async getWatchlist() {
    const data = await request<{ watchlist: BackendWatchlistEntry[] }>('/watchlist')
    return data.watchlist.map(toWatchlistItem)
  },

  async addTicker(ticker) {
    await request<BackendWatchlistEntry>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol: ticker }),
    })
  },

  async removeTicker(ticker) {
    try {
      await request(`/watchlist/${encodeURIComponent(ticker)}`, { method: 'DELETE' })
    } catch (error) {
      // Sudah tidak ada di backend = hasil yang diinginkan user, jadi bukan error.
      if (error instanceof ApiError && error.code === 'NOT_FOUND') return
      throw error
    }
  },

  async scanWatchlist() {
    return toScanResult(await request<BackendScanResult>('/scan', { method: 'POST' }))
  },

  investigate: (ticker) => notYetInBackend.investigate(ticker),
  challenge: (ticker) => notYetInBackend.challenge(ticker),
}
