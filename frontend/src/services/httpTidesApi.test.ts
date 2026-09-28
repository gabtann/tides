import { describe, expect, it } from 'vitest'
import { toScanResult, toWatchlistItem } from './httpTidesApi'

const at = '2026-09-28T10:00:00.000Z'

describe('toWatchlistItem', () => {
  it('renames backend fields', () => {
    expect(toWatchlistItem({ symbol: 'BBRI', added_at: at })).toEqual({ ticker: 'BBRI', addedAt: at })
  })
})

describe('toScanResult', () => {
  it('merges signals per ticker and keeps scan errors', () => {
    const result = toScanResult({
      scanned_at: at,
      queue: [
        { ticker: 'BBRI', type: 'PRICE_CHANGE', direction: 'UP', magnitude: '6.20%' },
        { ticker: 'BBRI', type: 'VOLUME_SPIKE', magnitude: '2.3x average' },
        { ticker: 'TLKM', type: 'NEAR_90D_LOW', magnitude: '3.0% of 90d range' },
        { ticker: 'ASII', type: 'PRICE_CHANGE', direction: 'DOWN', magnitude: '-5.10%' },
      ],
      errors: [{ symbol: 'ZZZZ', message: 'Symbol not found on Sectors', code: 'NOT_FOUND' }],
    })

    expect(result).toEqual({
      scannedAt: at,
      signals: [
        {
          ticker: 'BBRI',
          priority: 'HIGH',
          reason: 'Price moved 6.20% in one day · Volume at 2.3x average',
          detectedAt: at,
        },
        { ticker: 'TLKM', priority: 'LOW', reason: 'Near 90-day low (3.0% of 90d range)', detectedAt: at },
        { ticker: 'ASII', priority: 'MEDIUM', reason: 'Price moved -5.10% in one day', detectedAt: at },
      ],
      errors: [{ ticker: 'ZZZZ', message: 'Symbol not found on Sectors' }],
    })
  })
})