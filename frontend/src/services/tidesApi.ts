import type { ChallengeResult } from '../types/challenge'
import type { EvidenceBrief } from '../types/evidenceBrief'
import type { InvestigationResult } from '../types/investigation'
import type { ScanResult } from '../types/signal'
import type { Ticker } from '../types/ticker'
import type { WatchlistItem } from '../types/watchlist'

export interface TidesApi {
  getWatchlist(): Promise<WatchlistItem[]>
  addTicker(ticker: Ticker): Promise<void>
  removeTicker(ticker: Ticker): Promise<void>
  scanWatchlist(): Promise<ScanResult>
  investigate(ticker: Ticker): Promise<InvestigationResult>
  challenge(ticker: Ticker): Promise<ChallengeResult>
  getEvidenceBrief(ticker: Ticker): Promise<EvidenceBrief>
}