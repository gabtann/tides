import { describe, expect, it } from 'vitest'
import { companyName } from './companyNames'

describe('companyName', () => {
  it.each([
    ['BBRI', 'Bank Rakyat Indonesia'],
    ['BBCA', 'Bank Central Asia'],
    ['TLKM', 'Telkom Indonesia'],
    ['ASII', 'Astra International'],
    ['GOTO', 'GoTo Gojek Tokopedia'],
    ['UNVR', 'Unilever Indonesia'],
  ])('knows %s', (ticker, name) => {
    expect(companyName(ticker)).toBe(name)
  })

  it('returns undefined for tickers it does not know', () => {
    expect(companyName('ADRO')).toBeUndefined()
    expect(companyName('constructor')).toBeUndefined()
  })
})
