import type { Ticker } from '../types/ticker'

export const TICKER_FORMAT_ERROR = 'Ticker must be 4 letters, for example BBRI.'

export function duplicateTickerError(ticker: Ticker): string {
  return `${ticker} is already in your watchlist.`
}

export function validateTicker(
  input: string,
  existing: Ticker[],
): { ok: true; ticker: Ticker } | { ok: false; error: string } {
  const ticker = input.trim().toUpperCase()
  if (!/^[A-Z]{4}$/.test(ticker)) return { ok: false, error: TICKER_FORMAT_ERROR }
  if (existing.includes(ticker)) return { ok: false, error: duplicateTickerError(ticker) }
  return { ok: true, ticker }
}
