import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { api as defaultApi } from '../services'
import type { TidesApi } from '../services/tidesApi'
import { appReducer, createInitialState } from './appReducer'
import { loadWatchlist } from './loadWatchlist'
import { loadScanResult, saveScanResult } from './persistence'
import { AppStateContext } from './stateContext'

export function AppStateProvider({ children, api = defaultApi }: { children: ReactNode; api?: TidesApi }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => createInitialState(loadScanResult()))

  // Watchlist dimuat sekali untuk seluruh aplikasi, bukan per layar.
  useEffect(() => {
    void loadWatchlist(api, dispatch)
  }, [api])

  useEffect(() => {
    if (state.scan.result) saveScanResult(state.scan.result)
  }, [state.scan.result])

  const value = useMemo(() => ({ state, dispatch, api }), [state, api])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
