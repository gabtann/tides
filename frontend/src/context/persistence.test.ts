import { describe, expect, it, vi } from 'vitest'
import type { ScanResult } from '../types/signal'
import * as persistence from './persistence'
import { SCAN_KEY, loadScanResult, saveScanResult } from './persistence'

const at = '2026-09-23T12:00:00.000Z'
const scan: ScanResult = {
  scannedAt: at,
  signals: [{ ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: at }],
}

describe('scan persistence', () => {
  it('returns null when nothing is stored', () => {
    expect(loadScanResult()).toBeNull()
  })

  it('round-trips under tides.scan', () => {
    saveScanResult(scan)
    expect(SCAN_KEY).toBe('tides.scan')
    expect(JSON.parse(window.localStorage.getItem('tides.scan')!)).toEqual(scan)
    expect(loadScanResult()).toEqual(scan)
  })

  it.each(['not json', '{"foo":1}', 'null'])('ignores stored value %j', (raw) => {
    window.localStorage.setItem(SCAN_KEY, raw)
    expect(loadScanResult()).toBeNull()
  })

  it('rejects a stored scan with an unknown priority', () => {
    window.localStorage.setItem(
      SCAN_KEY,
      JSON.stringify({ ...scan, signals: [{ ...scan.signals[0], priority: 'URGENT' }] }),
    )
    expect(loadScanResult()).toBeNull()
  })

  it('no longer persists the watchlist, which now lives in the backend', () => {
    expect(Object.keys(persistence)).not.toContain('saveWatchlist')
    expect(Object.keys(persistence)).not.toContain('loadWatchlist')
  })
})

describe('blocked storage', () => {
  it('loads nothing when reading throws', () => {
    saveScanResult(scan)
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadScanResult()).toBeNull()
    expect(getItem).toHaveBeenCalled()
  })

  it('ignores write failures', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveScanResult(scan)).not.toThrow()
    expect(setItem).toHaveBeenCalledTimes(1)
  })
})
