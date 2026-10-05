import { Confidence, SignalType, type EvidenceBrief } from '../types/evidenceBrief'
import type { ContextBlock } from '../types/investigation'
import type { ResearchPriority } from '../types/priority'
import type { Signal } from '../types/signal'
import type { Ticker } from '../types/ticker'
import type { WatchlistItem } from '../types/watchlist'
import { loadJson, saveJson } from '../utils/storage'
import type { TidesApi } from './tidesApi'

// Detail simulasi, bukan bagian kontrak: backend asli menyimpan watchlist di Supabase.
export const MOCK_WATCHLIST_KEY = 'tides.mock.watchlist'

// Ticker yang ditolak mock, untuk mensimulasikan penolakan isi dari backend.
const UNLISTED_TICKERS = new Set(['ZZZZ', 'XXXX'])

function isWatchlist(value: unknown): value is WatchlistItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.ticker === 'string' &&
        typeof item.addedAt === 'string',
    )
  )
}

const readWatchlist = () => loadJson(MOCK_WATCHLIST_KEY, isWatchlist) ?? []
const writeWatchlist = (items: WatchlistItem[]) => saveJson(MOCK_WATCHLIST_KEY, items)

type MockSignal = { priority: ResearchPriority; reason: string }

const KNOWN_SIGNALS: Record<Ticker, MockSignal | null> = {
  BBRI: { priority: 'HIGH', reason: 'Unusual price-volume movement' },
  GOTO: { priority: 'HIGH', reason: 'Volume spike well above 20-day average' },
  TLKM: { priority: 'MEDIUM', reason: 'Price diverged from telecom peers' },
  ASII: { priority: 'MEDIUM', reason: 'Valuation moved outside 1-year range' },
  BBCA: { priority: 'LOW', reason: 'Minor change in trading volume' },
  UNVR: null,
}

const GENERIC_REASONS: Record<ResearchPriority, string> = {
  HIGH: 'Price and volume moved well outside the recent range',
  MEDIUM: 'Moved differently from sector peers',
  LOW: 'Small shift in trading activity',
}

const DERIVED_SLOTS: (ResearchPriority | null)[] = ['HIGH', 'MEDIUM', 'LOW', null]

export function mockSignalFor(ticker: Ticker): MockSignal | null {
  if (Object.hasOwn(KNOWN_SIGNALS, ticker)) return KNOWN_SIGNALS[ticker]
  const sum = [...ticker].reduce((total, char) => total + char.charCodeAt(0), 0)
  const priority = DERIVED_SLOTS[sum % DERIVED_SLOTS.length]
  return priority ? { priority, reason: GENERIC_REASONS[priority] } : null
}

function randomDelay(): number {
  return 500 + Math.random() * 1000
}

function block(label: string, summary: string, dataPoints: ContextBlock['dataPoints']): ContextBlock {
  return { label, summary, dataPoints }
}

// Struktur mengikuti kontrak EvidenceBrief. Ticker tanpa signal (misalnya UNVR) sengaja menghasilkan
// section kosong dan signal null, supaya tampilan kosong bisa dicek saat pengembangan UI.
export function mockEvidenceBrief(ticker: Ticker): EvidenceBrief {
  const signal = mockSignalFor(ticker)
  const base = {
    ticker,
    generatedAt: new Date().toISOString(),
    limitation: 'Peer comparison uses sector averages; individual peer data was not retrieved.',
  }
  if (!signal) {
    return {
      ...base,
      signal: null,
      observed: [],
      compared: [],
      interpreted: [],
      unknown: ['No signal was detected for this ticker in the latest scan.'],
      evidenceStrength: 'WEAK',
      researchPriority: 'LOW',
    }
  }
  const brief: EvidenceBrief = {
    ...base,
    signal: signal.reason,
    observed: [`${ticker} rose 6.2% over 5 days on 2.4x its 20-day average volume.`],
    compared: ['Sector peers rose 1.1% over the same period.'],
    interpreted: ['Part of the move is specific to this stock, part follows the sector.'],
    unknown: ['The data does not show what caused the extra volume.'],
    evidenceStrength: 'MODERATE',
    researchPriority: signal.priority,
  }

  // CP4.5: Tambahkan Challenge fields untuk BBCA/GOTO guna verifikasi CP4.5 tanpa merusak baseline CP3 pada BBRI
  if (ticker === 'BBCA' || ticker === 'GOTO') {
    brief.signalType = SignalType.PRICE_MOVEMENT
    brief.challengeStatus = 'SUPPORTED'
    brief.confidence = Confidence.MODERATE
    brief.challenge = {
      supporting: [`Volume increase for ${ticker} was confirmed across 3 consecutive trading sessions.`],
      contradicting: ['Sector peer performance was flat during the same window.'],
      alternativeExplanations: ['Broader market index rebalancing occurred on the same date.'],
      unknown: ['Foreign institutional net flow breakdown is not available in the current dataset.'],
    }
  }

  return brief
}

export function createMockTidesApi(options: { delayMs?: number | (() => number) } = {}): TidesApi {
  const { delayMs = randomDelay } = options
  const wait = () =>
    new Promise<void>((resolve) => setTimeout(resolve, typeof delayMs === 'function' ? delayMs() : delayMs))

  return {
    async getWatchlist() {
      await wait()
      return readWatchlist()
    },

    async addTicker(ticker) {
      await wait()
      const items = readWatchlist()
      if (items.some((item) => item.ticker === ticker)) throw new Error(`${ticker} is already in your watchlist.`)
      if (UNLISTED_TICKERS.has(ticker)) throw new Error(`${ticker} is not listed on IDX.`)
      writeWatchlist([...items, { ticker, addedAt: new Date().toISOString() }])
    },

    async removeTicker(ticker) {
      await wait()
      writeWatchlist(readWatchlist().filter((item) => item.ticker !== ticker))
    },

    async scanWatchlist() {
      await wait()
      const now = new Date().toISOString()
      const signals: Signal[] = readWatchlist().flatMap(({ ticker }) => {
        const signal = mockSignalFor(ticker)
        return signal ? [{ ticker, ...signal, detectedAt: now }] : []
      })
      return { scannedAt: now, signals }
    },

    async investigate(ticker) {
      await wait()
      return {
        ticker,
        whatChanged: block('What changed?', `${ticker} moved outside its recent trading range.`, {
          'Price change (5d)': '+6.2%',
          'Volume vs 20d average': '2.4x',
        }),
        historicalContext: block('Historical context', 'The move sits near the top of the 1-year range.', {
          '1y range position': '92nd percentile',
        }),
        peerContext: block('Peer context', 'Sector peers moved less over the same period.', {
          'Peer median change (5d)': '+1.1%',
        }),
        fundamentalContext: block('Fundamental context', 'Valuation is slightly below the sector median.', {
          'P/E': 11.4,
          'Sector median P/E': 13.2,
        }),
      }
    },

    async challenge(ticker) {
      await wait()
      return {
        ticker,
        initialSignal: `${ticker} showed an unusual price-volume movement.`,
        challengeFinding: 'Peer stocks showed a smaller, similar movement.',
        signalStrength: 'MODERATE',
      }
    },

     async getEvidenceBrief(ticker) {
      await wait()
      return mockEvidenceBrief(ticker)
    },
  }
}
