import type { ChallengeResult } from '../types/challenge'
import type { EvidenceBrief } from '../types/evidenceBrief'
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
  errorCode?: string
}

export interface ChallengeState {
  status: LoadStatus
  result?: ChallengeResult
  error?: string
}

export interface EvidenceBriefState {
  status: LoadStatus
  result?: EvidenceBrief
  error?: string
}

export interface AppState {
  watchlist: WatchlistState
  scan: ScanState
  // Per ticker, hanya di memori: hasil investigasi tidak disimpan ke localStorage.
  investigations: Record<Ticker, InvestigationState>
  // Sama seperti investigations: per ticker, hanya di memori.
  challenges: Record<Ticker, ChallengeState>
  // Evidence Brief dimuat sendiri (kontrak POST /api/agent/investigate), per ticker, hanya di memori.
  evidenceBriefs: Record<Ticker, EvidenceBriefState>
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
  | { type: 'INVESTIGATE_ERROR'; ticker: Ticker; error: string; errorCode?: string }
  | { type: 'CHALLENGE_START'; ticker: Ticker }
  | { type: 'CHALLENGE_SUCCESS'; ticker: Ticker; result: ChallengeResult }
  | { type: 'CHALLENGE_ERROR'; ticker: Ticker; error: string }
  | { type: 'EVIDENCE_BRIEF_START'; ticker: Ticker }
  | { type: 'EVIDENCE_BRIEF_SUCCESS'; ticker: Ticker; result: EvidenceBrief }
  | { type: 'EVIDENCE_BRIEF_ERROR'; ticker: Ticker; error: string }

export function createInitialState(result: ScanResult | null): AppState {
  return {
    watchlist: { status: 'idle', items: [] },
    scan: result ? { status: 'success', result } : { status: 'idle' },
    investigations: {},
    challenges: {},
    evidenceBriefs: {},
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
      return withInvestigation(state, action.ticker, { status: 'error', error: action.error, ...(action.errorCode ? { errorCode: action.errorCode } : {}) })
    case 'CHALLENGE_START':
      return withChallenge(state, action.ticker, { status: 'loading' })
    case 'CHALLENGE_SUCCESS':
      return withChallenge(state, action.ticker, { status: 'success', result: action.result })
    case 'CHALLENGE_ERROR':
      return withChallenge(state, action.ticker, { status: 'error', error: action.error })
    case 'EVIDENCE_BRIEF_START':
      return withEvidenceBrief(state, action.ticker, { status: 'loading' })
    case 'EVIDENCE_BRIEF_SUCCESS':
      return withEvidenceBrief(state, action.ticker, { status: 'success', result: action.result })
    case 'EVIDENCE_BRIEF_ERROR':
      return withEvidenceBrief(state, action.ticker, { status: 'error', error: action.error })
  }
}

function withInvestigation(state: AppState, ticker: Ticker, investigation: InvestigationState): AppState {
  return { ...state, investigations: { ...state.investigations, [ticker]: investigation } }
}

function withChallenge(state: AppState, ticker: Ticker, challenge: ChallengeState): AppState {
  return { ...state, challenges: { ...state.challenges, [ticker]: challenge } }
}

function withEvidenceBrief(state: AppState, ticker: Ticker, evidenceBrief: EvidenceBriefState): AppState {
  return { ...state, evidenceBriefs: { ...state.evidenceBriefs, [ticker]: evidenceBrief } }
}
