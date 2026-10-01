import { describe, expect, it } from 'vitest'
import { toScanResult, toWatchlistItem } from './httpTidesApi'

const at = '2026-09-30T10:00:00.000Z'

describe('toWatchlistItem', () => {
  it('renames backend fields', () => {
    expect(toWatchlistItem({ symbol: 'BBRI', added_at: at })).toEqual({ ticker: 'BBRI', addedAt: at })
  })
})

describe('toScanResult', () => {
  it('merges signals per ticker, keeps the highest backend priority and the scan errors', () => {
    const result = toScanResult({
      scanned_at: at,
      queue: [
        {
          ticker: 'BBRI',
          type: 'PRICE_MOVEMENT',
          priority: 'HIGH',
          description: 'Significant daily price movement detected.',
          details: { direction: 'UP', magnitude: 6.2 },
        },
        {
          ticker: 'BBRI',
          type: 'VOLUME_MOVEMENT',
          priority: 'MEDIUM',
          description: 'Trading volume significantly above average.',
          details: { direction: 'UP', magnitude: 2.3 },
        },
        {
          ticker: 'TLKM',
          type: 'HISTORICAL_DEVIATION',
          priority: 'MEDIUM',
          description: 'Price is near 90-day low.',
          details: { direction: 'LOW', magnitude: 3 },
        },
        {
          ticker: 'ASII',
          type: 'PRICE_MOVEMENT',
          priority: 'HIGH',
          description: 'Significant daily price movement detected.',
          details: { direction: 'DOWN', magnitude: 5.1 },
        },
      ],
      errors: [{ symbol: 'ZZZZ', message: 'Symbol not found on Sectors', code: 'NOT_FOUND' }],
    })

    expect(result).toEqual({
      scannedAt: at,
      signals: [
        {
          ticker: 'BBRI',
          priority: 'HIGH',
          reason: 'Price rose 6.2% in one day · Volume at 2.3x average',
          detectedAt: at,
        },
        { ticker: 'TLKM', priority: 'MEDIUM', reason: 'Near 90-day low (3% of range)', detectedAt: at },
        { ticker: 'ASII', priority: 'HIGH', reason: 'Price fell 5.1% in one day', detectedAt: at },
      ],
      errors: [{ ticker: 'ZZZZ', message: 'Symbol not found on Sectors' }],
    })
  })

  it('falls back to the backend description for an unknown signal type', () => {
    const result = toScanResult({
      scanned_at: at,
      queue: [
        {
          ticker: 'BBCA',
          type: 'PEER_DIVERGENCE',
          priority: 'LOW',
          description: 'Moved differently from sector peers.',
          details: { magnitude: 1.5 },
        },
      ],
      errors: [],
    })

    expect(result.signals).toEqual([
      { ticker: 'BBCA', priority: 'LOW', reason: 'Moved differently from sector peers.', detectedAt: at },
    ])
  })
})