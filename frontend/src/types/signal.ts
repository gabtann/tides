import type { ResearchPriority } from './priority'
import type { Ticker } from './ticker'

// Satu Signal per ticker. Kalau backend mengirim beberapa signal untuk satu ticker,
// httpTidesApi menggabungkannya dulu (lihat toScanResult).
export interface Signal {
  ticker: Ticker
  priority: ResearchPriority
  reason: string // ringkasan singkat, contoh: "Unusual price-volume movement"
  detectedAt: string
}

// Ticker yang gagal di-scan (misal tidak ditemukan di Sectors). Scan tetap berhasil untuk ticker lain.
export interface ScanError {
  ticker: Ticker
  message: string
}

export interface ScanResult {
  scannedAt: string
  signals: Signal[]
  errors?: ScanError[]
}
