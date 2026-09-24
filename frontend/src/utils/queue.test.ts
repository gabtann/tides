import { describe, expect, it } from 'vitest'
import type { ResearchPriority } from '../types/priority'
import type { ScanResult, Signal } from '../types/signal'
import { selectQueueGroups } from './queue'

const at = '2026-09-23T12:00:00.000Z'
const sig = (ticker: string, priority: ResearchPriority): Signal => ({
  ticker,
  priority,
  reason: `reason ${ticker}`,
  detectedAt: at,
})
const watch = (...tickers: string[]) => tickers.map((ticker) => ({ ticker, addedAt: at }))
const result: ScanResult = {
  scannedAt: at,
  signals: [sig('BBCA', 'LOW'), sig('BBRI', 'HIGH'), sig('TLKM', 'MEDIUM'), sig('GOTO', 'HIGH')],
}

describe('selectQueueGroups', () => {
  it('groups signals HIGH, MEDIUM, LOW and keeps scan order inside a group', () => {
    const groups = selectQueueGroups(result, watch('BBCA', 'BBRI', 'TLKM', 'GOTO'))
    expect(groups.map((g) => g.priority)).toEqual(['HIGH', 'MEDIUM', 'LOW'])
    expect(groups[0].signals.map((s) => s.ticker)).toEqual(['BBRI', 'GOTO'])
  })

  it('drops tickers no longer in the watchlist and omits empty groups', () => {
    const groups = selectQueueGroups(result, watch('BBRI', 'TLKM'))
    expect(groups.map((g) => g.priority)).toEqual(['HIGH', 'MEDIUM'])
    expect(groups.flatMap((g) => g.signals.map((s) => s.ticker))).toEqual(['BBRI', 'TLKM'])
  })

  it('returns no groups for an empty watchlist', () => {
    expect(selectQueueGroups(result, [])).toEqual([])
  })
})
