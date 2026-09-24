import type { Ticker } from '../types/ticker'

// Tabel statis untuk tampilan saja, bukan dari API. Isinya ticker yang dikenal mock;
// ticker lain tampil tanpa nama perusahaan.
const COMPANY_NAMES: Record<Ticker, string> = {
  BBRI: 'Bank Rakyat Indonesia',
  BBCA: 'Bank Central Asia',
  TLKM: 'Telkom Indonesia',
  ASII: 'Astra International',
  GOTO: 'GoTo Gojek Tokopedia',
  UNVR: 'Unilever Indonesia',
}

export function companyName(ticker: Ticker): string | undefined {
  return Object.hasOwn(COMPANY_NAMES, ticker) ? COMPANY_NAMES[ticker] : undefined
}
