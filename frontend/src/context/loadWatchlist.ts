import type { Dispatch } from 'react'
import type { TidesApi } from '../services/tidesApi'
import { errorMessage } from '../utils/errors'
import type { AppAction } from './appReducer'

export const WATCHLIST_LOAD_ERROR_MESSAGE = 'Your watchlist could not be loaded. Check your connection and try again.'

export async function loadWatchlist(api: TidesApi, dispatch: Dispatch<AppAction>): Promise<void> {
  dispatch({ type: 'WATCHLIST_LOAD_START' })
  try {
    dispatch({ type: 'WATCHLIST_LOAD_SUCCESS', items: await api.getWatchlist() })
  } catch (error) {
    dispatch({ type: 'WATCHLIST_LOAD_ERROR', error: errorMessage(error, WATCHLIST_LOAD_ERROR_MESSAGE) })
  }
}
