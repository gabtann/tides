import type { Ticker } from './ticker'

export interface WatchlistItem {
  ticker: Ticker
  addedAt: string // ISO date
}
