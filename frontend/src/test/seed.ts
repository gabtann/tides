import { SCAN_KEY } from '../context/persistence'
import { MOCK_WATCHLIST_KEY } from '../services/mockTidesApi'
import type { ScanResult } from '../types/signal'

// Mengisi "backend" mock, bukan state frontend.
export function seedWatchlist(tickers: string[]): void {
  window.localStorage.setItem(
    MOCK_WATCHLIST_KEY,
    JSON.stringify(tickers.map((ticker) => ({ ticker, addedAt: '2026-09-23T12:00:00.000Z' }))),
  )
}

export function seedScan(result: ScanResult): void {
  window.localStorage.setItem(SCAN_KEY, JSON.stringify(result))
}
