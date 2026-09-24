import { describe, expect, it } from 'vitest'
import { TICKER_FORMAT_ERROR, validateTicker } from './ticker'

describe('validateTicker', () => {
  it('trims and uppercases valid input', () => {
    expect(validateTicker('  bbri ', [])).toEqual({ ok: true, ticker: 'BBRI' })
  })

  it.each(['', 'BBR', 'BBRIX', 'BB1I', 'BB-I'])('rejects %j', (input) => {
    expect(validateTicker(input, [])).toEqual({ ok: false, error: TICKER_FORMAT_ERROR })
  })

  it('uses the exact format message', () => {
    expect(TICKER_FORMAT_ERROR).toBe('Ticker must be 4 letters, for example BBRI.')
  })

  it('rejects a ticker already in the watchlist', () => {
    expect(validateTicker('bbri', ['BBRI'])).toEqual({
      ok: false,
      error: 'BBRI is already in your watchlist.',
    })
  })
})
