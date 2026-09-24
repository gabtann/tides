import type { ResearchPriority } from './priority'
import type { Ticker } from './ticker'

export interface Signal {
  ticker: Ticker
  priority: ResearchPriority
  reason: string // ringkasan singkat, contoh: "Unusual price-volume movement"
  detectedAt: string
}

export interface ScanResult {
  scannedAt: string
  signals: Signal[]
}
