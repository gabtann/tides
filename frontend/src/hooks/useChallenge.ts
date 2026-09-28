import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'
import type { Ticker } from '../types/ticker'
import { errorMessage } from '../utils/errors'

export const CHALLENGE_ERROR_MESSAGE =
  'Challenge failed: the TIDES service could not be reached. Check your connection and try again.'

export function useChallenge(ticker: Ticker) {
  const { state, dispatch, api } = useAppState()
  const { status = 'idle', result, error } = state.challenges[ticker] ?? {}

  // Idempotent seperti useInvestigation: tidak memanggil ulang selagi berjalan atau kalau hasilnya sudah ada.
  const start = useCallback(async () => {
    if (status === 'loading' || status === 'success') return
    dispatch({ type: 'CHALLENGE_START', ticker })
    try {
      dispatch({ type: 'CHALLENGE_SUCCESS', ticker, result: await api.challenge(ticker) })
    } catch (err) {
      dispatch({ type: 'CHALLENGE_ERROR', ticker, error: errorMessage(err, CHALLENGE_ERROR_MESSAGE) })
    }
  }, [status, ticker, dispatch, api])

  return { status, result, error, start }
}