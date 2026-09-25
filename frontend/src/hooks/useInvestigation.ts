import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'
import type { Ticker } from '../types/ticker'

export const INVESTIGATE_ERROR_MESSAGE =
  'Investigation failed: the TIDES service could not be reached. Check your connection and try again.'

export function useInvestigation(ticker: Ticker) {
  const { state, dispatch, api } = useAppState()
  const { status = 'idle', result, error } = state.investigations[ticker] ?? {}

  // Idempotent: tidak memanggil ulang selagi berjalan atau kalau hasilnya sudah ada di context.
  const start = useCallback(async () => {
    if (status === 'loading' || status === 'success') return
    dispatch({ type: 'INVESTIGATE_START', ticker })
    try {
      dispatch({ type: 'INVESTIGATE_SUCCESS', ticker, result: await api.investigate(ticker) })
    } catch {
      dispatch({ type: 'INVESTIGATE_ERROR', ticker, error: INVESTIGATE_ERROR_MESSAGE })
    }
  }, [status, ticker, dispatch, api])

  return { status, result, error, start }
}
