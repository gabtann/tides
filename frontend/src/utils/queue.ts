import type { ResearchPriority } from '../types/priority'
import type { ScanResult, Signal } from '../types/signal'
import type { WatchlistItem } from '../types/watchlist'

export interface QueueGroup {
  priority: ResearchPriority
  signals: Signal[]
}

export const PRIORITY_ORDER: ResearchPriority[] = ['HIGH', 'MEDIUM', 'LOW']

// Turunan saat render: ticker yang sudah dihapus dari watchlist tidak ditampilkan.
export function selectQueueGroups(result: ScanResult, watchlist: WatchlistItem[]): QueueGroup[] {
  const watched = new Set(watchlist.map((item) => item.ticker))
  const visible = result.signals.filter((signal) => watched.has(signal.ticker))
  return PRIORITY_ORDER.map((priority) => ({
    priority,
    signals: visible.filter((signal) => signal.priority === priority),
  })).filter((group) => group.signals.length > 0)
}
