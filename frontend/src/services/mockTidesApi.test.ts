import { describe, expect, it } from 'vitest'
import { MOCK_WATCHLIST_KEY, createMockTidesApi, mockSignalFor } from './mockTidesApi'

const api = createMockTidesApi({ delayMs: 0 })

async function watch(...tickers: string[]) {
  for (const ticker of tickers) await api.addTicker(ticker)
}

describe('mockSignalFor', () => {
  it('uses the prepared signal for known tickers', () => {
    expect(mockSignalFor('BBRI')).toEqual({ priority: 'HIGH', reason: 'Unusual price-volume movement' })
    expect(mockSignalFor('UNVR')).toBeNull()
  })

  it('derives priority from the character code sum for unknown tickers', () => {
    expect(mockSignalFor('AAAA')?.priority).toBe('HIGH') // 260 % 4 = 0
    expect(mockSignalFor('AAAB')?.priority).toBe('MEDIUM') // 261 % 4 = 1
    expect(mockSignalFor('AAAC')?.priority).toBe('LOW') // 262 % 4 = 2
    expect(mockSignalFor('AAAD')).toBeNull() // 263 % 4 = 3
  })
})

describe('mock watchlist', () => {
  it('starts empty', async () => {
    expect(await api.getWatchlist()).toEqual([])
  })

  it('adds tickers in order and persists them under tides.mock.watchlist', async () => {
    await watch('BBRI', 'TLKM')
    expect((await api.getWatchlist()).map((i) => i.ticker)).toEqual(['BBRI', 'TLKM'])
    expect(MOCK_WATCHLIST_KEY).toBe('tides.mock.watchlist')
    const stored = JSON.parse(window.localStorage.getItem('tides.mock.watchlist')!)
    expect(stored.map((i: { ticker: string }) => i.ticker)).toEqual(['BBRI', 'TLKM'])
    expect(Number.isNaN(Date.parse(stored[0].addedAt))).toBe(false)
  })

  it('survives a new mock instance, like a page reload', async () => {
    await watch('BBRI')
    const reloaded = createMockTidesApi({ delayMs: 0 })
    expect((await reloaded.getWatchlist()).map((i) => i.ticker)).toEqual(['BBRI'])
  })

  it('rejects a duplicate ticker', async () => {
    await watch('BBRI')
    await expect(api.addTicker('BBRI')).rejects.toThrow('BBRI is already in your watchlist.')
  })

  it('rejects tickers the backend does not recognise', async () => {
    await expect(api.addTicker('ZZZZ')).rejects.toThrow('ZZZZ is not listed on IDX.')
    expect(await api.getWatchlist()).toEqual([])
  })

  it('removes a ticker and ignores tickers that are not there', async () => {
    await watch('BBRI', 'TLKM')
    await api.removeTicker('BBRI')
    await expect(api.removeTicker('ASII')).resolves.toBeUndefined()
    expect((await api.getWatchlist()).map((i) => i.ticker)).toEqual(['TLKM'])
  })
})

describe('mock scan and research', () => {
  it('scans the stored watchlist', async () => {
    await watch('BBRI', 'TLKM')
    const result = await api.scanWatchlist()
    expect(result.signals.map((s) => s.ticker)).toEqual(['BBRI', 'TLKM'])
    expect(result.signals[0]).toMatchObject({
      ticker: 'BBRI',
      priority: 'HIGH',
      reason: 'Unusual price-volume movement',
    })
    expect(Number.isNaN(Date.parse(result.scannedAt))).toBe(false)
    expect(result.signals[0].detectedAt).toBe(result.scannedAt)
  })

  it('returns no signals for a watchlist without notable changes', async () => {
    expect((await api.scanWatchlist()).signals).toEqual([])
    await watch('UNVR')
    expect((await api.scanWatchlist()).signals).toEqual([])
  })

  it('returns four context blocks from investigate', async () => {
    const result = await api.investigate('BBRI')
    expect(result.ticker).toBe('BBRI')
    expect(result.whatChanged.label).toBe('What changed?')
    expect(result.historicalContext.label).toBe('Historical context')
    expect(result.peerContext.label).toBe('Peer context')
    expect(result.fundamentalContext.label).toBe('Fundamental context')
  })

  it('includes the evidence brief in the challenge result', async () => {
    const result = await api.challenge('BBRI')
    expect(result.brief.ticker).toBe('BBRI')
    expect(result.brief.researchPriority).toBe('HIGH')
    expect(['STRONG', 'MODERATE', 'WEAK']).toContain(result.signalStrength)
  })
})
