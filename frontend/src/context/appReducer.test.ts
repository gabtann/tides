import { describe, expect, it } from 'vitest'
import type { InvestigationResult } from '../types/investigation'
import type { ScanResult } from '../types/signal'
import { appReducer, createInitialState, type AppState } from './appReducer'

const at = '2026-09-23T12:00:00.000Z'
const item = (ticker: string) => ({ ticker, addedAt: at })
const result: ScanResult = {
  scannedAt: at,
  signals: [{ ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: at }],
}
const loaded = (...tickers: string[]): AppState =>
  appReducer(createInitialState(null), { type: 'WATCHLIST_LOAD_SUCCESS', items: tickers.map(item) })

describe('createInitialState', () => {
  it('starts with an unloaded watchlist and no scan', () => {
    expect(createInitialState(null)).toEqual({
      watchlist: { status: 'idle', items: [] },
      scan: { status: 'idle' },
      investigations: {},
    })
  })

  it('restores a stored scan', () => {
    expect(createInitialState(result).scan).toEqual({ status: 'success', result })
  })
})

describe('watchlist loading', () => {
  it('marks loading and keeps the items it already has', () => {
    const next = appReducer(loaded('BBRI'), { type: 'WATCHLIST_LOAD_START' })
    expect(next.watchlist).toEqual({ status: 'loading', items: [item('BBRI')] })
  })

  it('stores loaded items and clears an earlier error', () => {
    const failed = appReducer(createInitialState(null), { type: 'WATCHLIST_LOAD_ERROR', error: 'down' })
    const next = appReducer(failed, { type: 'WATCHLIST_LOAD_SUCCESS', items: [item('TLKM')] })
    expect(next.watchlist).toEqual({ status: 'success', items: [item('TLKM')] })
  })

  it('records a load error and keeps the items it already has', () => {
    const next = appReducer(loaded('BBRI'), { type: 'WATCHLIST_LOAD_ERROR', error: 'down' })
    expect(next.watchlist).toEqual({ status: 'error', items: [item('BBRI')], error: 'down' })
  })
})

describe('confirmed watchlist changes', () => {
  it('appends a ticker without changing the status', () => {
    const next = appReducer(loaded('BBRI'), { type: 'ADD_TICKER', ticker: 'TLKM', addedAt: at })
    expect(next.watchlist).toEqual({ status: 'success', items: [item('BBRI'), item('TLKM')] })
  })

  it('ignores a duplicate ticker', () => {
    const state = loaded('BBRI')
    expect(appReducer(state, { type: 'ADD_TICKER', ticker: 'BBRI', addedAt: at })).toBe(state)
  })

  it('removes only the given ticker', () => {
    const next = appReducer(loaded('BBRI', 'TLKM'), { type: 'REMOVE_TICKER', ticker: 'BBRI' })
    expect(next.watchlist.items).toEqual([item('TLKM')])
  })
})

describe('scan', () => {
  const withResult = createInitialState(result)

  it('keeps the previous result while loading', () => {
    expect(appReducer(withResult, { type: 'SCAN_START' }).scan).toEqual({ status: 'loading', result })
  })

  it('stores a successful result and clears the error', () => {
    const failed = appReducer(createInitialState(null), { type: 'SCAN_ERROR', error: 'down' })
    expect(appReducer(failed, { type: 'SCAN_SUCCESS', result }).scan).toEqual({ status: 'success', result })
  })

  it('records an error and keeps the previous result', () => {
    expect(appReducer(withResult, { type: 'SCAN_ERROR', error: 'down' }).scan).toEqual({
      status: 'error',
      result,
      error: 'down',
    })
  })
})

describe('investigations', () => {
  const block = { label: 'x', summary: 'y', dataPoints: {} }
  const investigation: InvestigationResult = {
    ticker: 'BBRI',
    whatChanged: block,
    historicalContext: block,
    peerContext: block,
    fundamentalContext: block,
  }
  const start = (state: AppState, ticker: string) => appReducer(state, { type: 'INVESTIGATE_START', ticker })

  it('marks one ticker as loading without touching the others', () => {
    const withTlkm = appReducer(start(createInitialState(null), 'TLKM'), {
      type: 'INVESTIGATE_ERROR',
      ticker: 'TLKM',
      error: 'down',
    })
    const next = start(withTlkm, 'BBRI')
    expect(next.investigations).toEqual({
      TLKM: { status: 'error', error: 'down' },
      BBRI: { status: 'loading' },
    })
  })

  it('stores the result for the ticker', () => {
    const next = appReducer(start(createInitialState(null), 'BBRI'), {
      type: 'INVESTIGATE_SUCCESS',
      ticker: 'BBRI',
      result: investigation,
    })
    expect(next.investigations.BBRI).toEqual({ status: 'success', result: investigation })
  })

  it('clears an earlier error when retried', () => {
    const failed = appReducer(start(createInitialState(null), 'BBRI'), {
      type: 'INVESTIGATE_ERROR',
      ticker: 'BBRI',
      error: 'down',
    })
    expect(start(failed, 'BBRI').investigations.BBRI).toEqual({ status: 'loading' })
  })
})
