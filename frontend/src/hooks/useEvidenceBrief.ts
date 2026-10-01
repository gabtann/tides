import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'
import type { Ticker } from '../types/ticker'
import { errorMessage } from '../utils/errors'

export const EVIDENCE_BRIEF_ERROR_MESSAGE =
  'The evidence brief could not be loaded. Check your connection and try again.'

export function useEvidenceBrief(ticker: Ticker) {
  const { state, dispatch, api } = useAppState()
  const { status = 'idle', result, error } = state.evidenceBriefs[ticker] ?? {}

  // Idempotent seperti useChallenge: tidak memanggil ulang selagi berjalan atau kalau hasilnya sudah ada.
  const start = useCallback(async () => {
    if (status === 'loading' || status === 'success') return
    dispatch({ type: 'EVIDENCE_BRIEF_START', ticker })
    try {
      dispatch({ type: 'EVIDENCE_BRIEF_SUCCESS', ticker, result: await api.getEvidenceBrief(ticker) })
    } catch (err) {
      dispatch({ type: 'EVIDENCE_BRIEF_ERROR', ticker, error: errorMessage(err, EVIDENCE_BRIEF_ERROR_MESSAGE) })
    }
  }, [status, ticker, dispatch, api])

  return { status, result, error, start }
}