import { act } from '@testing-library/react'
import { createMockTidesApi } from '../services/mockTidesApi'
import type { TidesApi } from '../services/tidesApi'

type Held = 'getWatchlist' | 'addTicker' | 'removeTicker' | 'scanWatchlist' | 'investigate'

interface Pending {
  run: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

// Method yang ditahan menunggu sampai test memanggil resolve/reject, supaya state loading bisa diperiksa.
// scanWatchlist selalu ditahan; method lain hanya kalau disebut di `hold`.
export function createControlledApi({ hold = [] }: { hold?: Held[] } = {}) {
  const base = createMockTidesApi({ delayMs: 0 })
  const held = new Set<Held>(['scanWatchlist', ...hold])
  const pending: Record<Held, Pending[]> = {
    getWatchlist: [],
    addTicker: [],
    removeTicker: [],
    scanWatchlist: [],
    investigate: [],
  }
  const calls: Record<Held, number> = { getWatchlist: 0, addTicker: 0, removeTicker: 0, scanWatchlist: 0, investigate: 0 }

  function wrap<T>(method: Held, run: () => Promise<T>): Promise<T> {
    calls[method] += 1
    if (!held.has(method)) return run()
    return new Promise<T>((resolve, reject) =>
      pending[method].push({ run, resolve: resolve as (value: unknown) => void, reject }),
    )
  }

  function take(method: Held): Pending {
    const next = pending[method].shift()
    if (!next) throw new Error(`No pending ${method}`)
    return next
  }

  const api: TidesApi = {
    ...base,
    getWatchlist: () => wrap('getWatchlist', () => base.getWatchlist()),
    addTicker: (ticker) => wrap('addTicker', () => base.addTicker(ticker)),
    removeTicker: (ticker) => wrap('removeTicker', () => base.removeTicker(ticker)),
    scanWatchlist: () => wrap('scanWatchlist', () => base.scanWatchlist()),
    investigate: (ticker) => wrap('investigate', () => base.investigate(ticker)),
  }

  async function resolve(method: Held) {
    const next = take(method)
    const value = await next.run()
    await act(async () => next.resolve(value))
  }

  async function reject(method: Held, message = 'network down') {
    const next = take(method)
    await act(async () => next.reject(new Error(message)))
  }

  return {
    api,
    calls,
    resolve,
    reject,
    resolveNext: () => resolve('scanWatchlist'),
    rejectNext: () => reject('scanWatchlist'),
  }
}
