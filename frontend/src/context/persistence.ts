import type { ScanResult } from '../types/signal'
import { PRIORITY_ORDER } from '../utils/queue'
import { loadJson, saveJson } from '../utils/storage'

// Hanya hasil scan yang disimpan di device. Watchlist disimpan di backend.
export const SCAN_KEY = 'tides.scan'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isScanResult(value: unknown): value is ScanResult {
  return (
    isRecord(value) &&
    typeof value.scannedAt === 'string' &&
    Array.isArray(value.signals) &&
    value.signals.every(
      (signal) =>
        isRecord(signal) &&
        typeof signal.ticker === 'string' &&
        (PRIORITY_ORDER as unknown[]).includes(signal.priority) &&
        typeof signal.reason === 'string' &&
        typeof signal.detectedAt === 'string',
    )
  )
}

export function loadScanResult(): ScanResult | null {
  return loadJson(SCAN_KEY, isScanResult)
}

export function saveScanResult(result: ScanResult): void {
  saveJson(SCAN_KEY, result)
}
