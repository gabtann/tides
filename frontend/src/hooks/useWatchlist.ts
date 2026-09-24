import { useCallback } from 'react'
import { loadWatchlist } from '../context/loadWatchlist'
import { useAppState } from '../context/stateContext'
import type { Ticker } from '../types/ticker'
import { errorMessage } from '../utils/errors'
import { validateTicker } from '../utils/ticker'

export function useWatchlist() {
  const { state, dispatch, api } = useAppState()
  const { status, items, error } = state.watchlist

  const reload = useCallback(() => {
    if (status !== 'loading') void loadWatchlist(api, dispatch)
  }, [status, api, dispatch])

  // add dan remove pesimis: cache berubah setelah backend mengonfirmasi.
  // Mengembalikan pesan error, atau null kalau berhasil.
  const add = useCallback(
    async (input: string): Promise<string | null> => {
      const result = validateTicker(
        input,
        items.map((item) => item.ticker),
      )
      if (!result.ok) return result.error
      try {
        await api.addTicker(result.ticker)
        dispatch({ type: 'ADD_TICKER', ticker: result.ticker, addedAt: new Date().toISOString() })
        return null
      } catch (err) {
        return errorMessage(err, `${result.ticker} could not be added. Check your connection and try again.`)
      }
    },
    [items, api, dispatch],
  )

  const remove = useCallback(
    async (ticker: Ticker): Promise<string | null> => {
      try {
        await api.removeTicker(ticker)
        dispatch({ type: 'REMOVE_TICKER', ticker })
        return null
      } catch (err) {
        return errorMessage(err, `${ticker} could not be removed. Check your connection and try again.`)
      }
    },
    [api, dispatch],
  )

  return { status, items, error, reload, add, remove }
}
