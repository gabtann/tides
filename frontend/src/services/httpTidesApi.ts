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

// Bentuk item queue dari POST /api/scan (backend signal-engine.service.js).
interface BackendSignal {
  ticker: string
  type: string // PRICE_MOVEMENT | VOLUME_MOVEMENT | HISTORICAL_DEVIATION | PEER_DIVERGENCE
  priority: ResearchPriority
  description: string
  details: { direction?: 'UP' | 'DOWN' | 'HIGH' | 'LOW'; magnitude: number }
}

interface BackendScanResult {
  scanned_at: string
  queue: BackendSignal[]
  errors: { symbol: string; message: string; code: string }[]
}

// Kalimat reason disusun dari details; tipe yang belum dikenal memakai description dari backend.
function describeSignal({ type, details, description }: BackendSignal): string {
  switch (type) {
    case 'PRICE_MOVEMENT':
      return `Price ${details.direction === 'DOWN' ? 'fell' : 'rose'} ${details.magnitude}% in one day`
    case 'VOLUME_MOVEMENT':
      return `Volume at ${details.magnitude}x average`
    case 'HISTORICAL_DEVIATION':
      return `Near 90-day ${details.direction === 'LOW' ? 'low' : 'high'} (${details.magnitude}% of range)`
    default:
      return description
  }
}

// Satu ticker bisa punya beberapa signal; kartu memakai priority tertinggi yang dikirim backend.
function priorityFor(group: BackendSignal[]): ResearchPriority {
  return PRIORITY_ORDER.find((priority) => group.some((signal) => signal.priority === priority)) ?? 'LOW'
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

// Sementara dipinjam dari mock: /challenge belum ada (K17), dan /agent/investigate belum mengembalikan Evidence Brief (K39).
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
  getEvidenceBrief: (ticker) => notYetInBackend.getEvidenceBrief(ticker),
}
