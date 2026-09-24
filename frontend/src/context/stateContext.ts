import { createContext, useContext, type Dispatch } from 'react'
import type { TidesApi } from '../services/tidesApi'
import type { AppAction, AppState } from './appReducer'

export interface AppStateContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
  api: TidesApi
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used inside AppStateProvider')
  return value
}
