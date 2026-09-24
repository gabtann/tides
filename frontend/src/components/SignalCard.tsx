import { Link } from 'react-router'
import type { Signal } from '../types/signal'
import { companyName } from '../utils/companyNames'
import { formatRelativeTime } from '../utils/relativeTime'
import { Card } from './Card'
import { PriorityBadge } from './PriorityBadge'

const CARD_ACCENT = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const

// Seluruh kartu adalah satu <Link>. Chevron hanya isyarat visual (aria-hidden), bukan link kedua,
// karena link bersarang tidak valid (StyleDesign §6).
export function SignalCard({ signal }: { signal: Signal }) {
  const name = companyName(signal.ticker)
  return (
    <Link to={`/signal/${signal.ticker}`} className="block rounded-xl">
      <Card accent={CARD_ACCENT[signal.priority]}>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0">
            <span className="font-semibold tabular-nums">{signal.ticker}</span>
            {name && <span className="ml-2 text-[13px] leading-[18px] text-muted">{name}</span>}
          </p>
          <PriorityBadge priority={signal.priority} />
        </div>
        <p className="mt-1">{signal.reason}</p>
        <div className="mt-3 flex items-center justify-between text-[13px] leading-[18px] text-muted">
          <span>{formatRelativeTime(signal.detectedAt)}</span>
          <span aria-hidden="true">›</span>
        </div>
      </Card>
    </Link>
  )
}
