import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'
import type { Ticker } from '../types/ticker'
import { errorMessage } from '../utils/errors'

export const INVESTIGATE_ERROR_MESSAGE =
  'Investigation failed: the TIDES service could not be reached. Check your connection and try again.'

export function useInvestigation(ticker: Ticker) {
  const { state, dispatch, api } = useAppState()
  const { status = 'idle', result, error, errorCode } = state.investigations[ticker] ?? {}

  // Idempotent: tidak memanggil ulang selagi berjalan atau kalau hasilnya sudah ada di context.
  const start = useCallback(async () => {
    if (status === 'loading' || status === 'success') return
    dispatch({ type: 'INVESTIGATE_START', ticker })
    try {
      dispatch({ type: 'INVESTIGATE_SUCCESS', ticker, result: await api.investigate(ticker) })
    } catch (err) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof err.code === 'string'
          ? err.code
          : undefined

      dispatch({
        type: 'INVESTIGATE_ERROR',
        ticker,
        error: errorMessage(err, INVESTIGATE_ERROR_MESSAGE),
        errorCode: code,
      })
    }
  }, [status, ticker, dispatch, api])

  return { status, result, error, errorCode, start }
}
