import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'

export const SCAN_ERROR_MESSAGE =
  'Scan failed: the TIDES service could not be reached. Check your connection and try again.'

export function useScan() {
  const { state, dispatch, api } = useAppState()
  const { status, result, error } = state.scan
  const watchlist = state.watchlist

  // Backend membaca watchlist dari sesi, jadi scan hanya jalan kalau cache watchlist sudah dimuat dan tidak kosong.
  const canScan = status !== 'loading' && watchlist.status === 'success' && watchlist.items.length > 0

  const startScan = useCallback(async () => {
    if (!canScan) return
    dispatch({ type: 'SCAN_START' })
    try {
      dispatch({ type: 'SCAN_SUCCESS', result: await api.scanWatchlist() })
    } catch {
      dispatch({ type: 'SCAN_ERROR', error: SCAN_ERROR_MESSAGE })
    }
  }, [canScan, dispatch, api])

  return { status, result, error, canScan, startScan }
}
