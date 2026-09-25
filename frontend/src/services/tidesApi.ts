import type { ChallengeResult } from '../types/challenge'
import type { InvestigationResult } from '../types/investigation'
import type { ScanResult } from '../types/signal'
import type { Ticker } from '../types/ticker'
import type { WatchlistItem } from '../types/watchlist'

// Watchlist disimpan di backend dan dibaca dari identitas sesi, jadi scanWatchlist tidak menerima ticker.
// Method yang gagal me-reject dengan Error yang message-nya layak ditampilkan ke user.
export interface TidesApi {
  getWatchlist(): Promise<WatchlistItem[]>
  addTicker(ticker: Ticker): Promise<void>
  removeTicker(ticker: Ticker): Promise<void>
  scanWatchlist(): Promise<ScanResult>
  investigate(ticker: Ticker): Promise<InvestigationResult>
  challenge(ticker: Ticker): Promise<ChallengeResult>
}
