import { useCallback } from 'react'
import { useAppState } from '../context/stateContext'
import { errorMessage } from '../utils/errors'

// Hanya dipakai kalau api me-reject tanpa Error ber-message; biasanya pesan asli dari api yang tampil.
export const SCAN_ERROR_MESSAGE = 'Scan failed. Please try again.'

export function useScan() {
  const { state, dispatch, api } = useAppState()
  const { status, result, error } = state.scan
  const watchlist = state.watchlist

  // Backend membaca watchlist dari sesi, jadi scan hanya jalan kalau cache watchlist sudah dimuat dan tidak kosong.
  const canScan = status !== 'loading' && watchlist.status === 'success' && watchlist.items.length > 0

  const startScan = useCallback(async () => {
    if (!canScan) return

    const scannedTickers = watchlist.items.map((item) => item.ticker)
    dispatch({ type: 'SCAN_START' })

    try {
      const result = await api.scanWatchlist()
      dispatch({
        type: 'SCAN_SUCCESS',
        result: { ...result, scannedTickers },
      })
    } catch (err) {
      dispatch({ type: 'SCAN_ERROR', error: errorMessage(err, SCAN_ERROR_MESSAGE) })
    }
  }, [canScan, dispatch, api, watchlist.items])

  return { status, result, error, canScan, startScan }
}
