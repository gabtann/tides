import type { InvestigationResult } from '../types/investigation'
import type { ScanResult } from '../types/signal'
import type { Ticker } from '../types/ticker'
import type { WatchlistItem } from '../types/watchlist'

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

// Watchlist adalah cache dari backend. Bentuknya sengaja sama dengan ScanState.
export interface WatchlistState {
  status: LoadStatus
  items: WatchlistItem[]
  error?: string
}

export interface ScanState {
  status: LoadStatus
  result?: ScanResult
  error?: string
}

export interface InvestigationState {
  status: LoadStatus
  result?: InvestigationResult
  error?: string
}

export interface AppState {
  watchlist: WatchlistState
  scan: ScanState
  // Per ticker, hanya di memori: hasil investigasi tidak disimpan ke localStorage.
  investigations: Record<Ticker, InvestigationState>
}

export type AppAction =
  | { type: 'WATCHLIST_LOAD_START' }
  | { type: 'WATCHLIST_LOAD_SUCCESS'; items: WatchlistItem[] }
  | { type: 'WATCHLIST_LOAD_ERROR'; error: string }
  // ADD_TICKER dan REMOVE_TICKER hanya di-dispatch setelah backend mengonfirmasi.
  | { type: 'ADD_TICKER'; ticker: Ticker; addedAt: string }
  | { type: 'REMOVE_TICKER'; ticker: Ticker }
  | { type: 'SCAN_START' }
  | { type: 'SCAN_SUCCESS'; result: ScanResult }
  | { type: 'SCAN_ERROR'; error: string }
  | { type: 'INVESTIGATE_START'; ticker: Ticker }
  | { type: 'INVESTIGATE_SUCCESS'; ticker: Ticker; result: InvestigationResult }
  | { type: 'INVESTIGATE_ERROR'; ticker: Ticker; error: string }

export function createInitialState(result: ScanResult | null): AppState {
  return {
    watchlist: { status: 'idle', items: [] },
    scan: result ? { status: 'success', result } : { status: 'idle' },
    investigations: {},
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  const { watchlist } = state
  switch (action.type) {
    case 'WATCHLIST_LOAD_START':
      return { ...state, watchlist: { status: 'loading', items: watchlist.items } }
    case 'WATCHLIST_LOAD_SUCCESS':
      return { ...state, watchlist: { status: 'success', items: action.items } }
    case 'WATCHLIST_LOAD_ERROR':
      return { ...state, watchlist: { status: 'error', items: watchlist.items, error: action.error } }
    case 'ADD_TICKER':
      if (watchlist.items.some((item) => item.ticker === action.ticker)) return state
      return {
        ...state,
        watchlist: { ...watchlist, items: [...watchlist.items, { ticker: action.ticker, addedAt: action.addedAt }] },
      }
    case 'REMOVE_TICKER':
      return {
        ...state,
        watchlist: { ...watchlist, items: watchlist.items.filter((item) => item.ticker !== action.ticker) },
      }
    case 'SCAN_START':
      return { ...state, scan: { status: 'loading', result: state.scan.result } }
    case 'SCAN_SUCCESS':
      return { ...state, scan: { status: 'success', result: action.result } }
    case 'SCAN_ERROR':
      return { ...state, scan: { status: 'error', result: state.scan.result, error: action.error } }
    case 'INVESTIGATE_START':
      return withInvestigation(state, action.ticker, { status: 'loading' })
    case 'INVESTIGATE_SUCCESS':
      return withInvestigation(state, action.ticker, { status: 'success', result: action.result })
    case 'INVESTIGATE_ERROR':
      return withInvestigation(state, action.ticker, { status: 'error', error: action.error })
  }
}

function withInvestigation(state: AppState, ticker: Ticker, investigation: InvestigationState): AppState {
  return { ...state, investigations: { ...state.investigations, [ticker]: investigation } }
}
