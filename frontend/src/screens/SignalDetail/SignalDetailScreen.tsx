import { Link, useNavigate, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { PriorityBadge } from '../../components/PriorityBadge'
import { useAppState } from '../../context/stateContext'
import { useInvestigation } from '../../hooks/useInvestigation'
import { companyName } from '../../utils/companyNames'
import { formatRelativeTime } from '../../utils/relativeTime'

// Preview ringan dari hasil scan yang sudah ada di context. Tidak ada fetch di sini:
// investigate() yang mahal baru dipanggil saat user menekan Investigate.
export function SignalDetailScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { state } = useAppState()
  const signal = state.scan.result?.signals.find((s) => s.ticker === ticker)
  const { start } = useInvestigation(ticker)
  const navigate = useNavigate()

  if (!signal) {
    return (
      <section>
        <p className="max-w-[60ch] text-muted">
          This signal isn't loaded. Open it from the Research Queue to see its details.
        </p>
        <Link to="/queue" className="mt-3 inline-block rounded text-link hover:underline hover:underline-offset-4">
          Go to research queue
        </Link>
      </section>
    )
  }

  const name = companyName(signal.ticker)
  const investigate = () => {
    void start()
    navigate(`/investigate/${signal.ticker}`)
  }

  return (
    <section>
      <BackLink to="/queue">Back to research queue</BackLink>
      <header className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-[34px] font-semibold tabular-nums">{signal.ticker}</h1>
          {name && <p className="mt-1 text-muted">{name}</p>}
        </div>
        <PriorityBadge priority={signal.priority} />
      </header>

      <div className="mt-6 rounded-xl border border-line border-l-4 border-l-link bg-surface p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-link">
          Detected signal
        </p>
        <p className="mt-1 font-display text-[20px] leading-[28px] font-medium text-fg">
          {signal.reason}
        </p>
      </div>
      <p className="mt-2 text-[13px] leading-[18px] text-muted">{formatRelativeTime(signal.detectedAt)}</p>

      <div className="mt-6 max-w-[60ch] rounded-lg border border-medium/30 border-l-4 border-l-medium bg-surface p-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-medium">
          Priority note
        </p>
        <p className="mt-1 text-[13px] leading-[18px] text-fg">
          HIGH indicates research priority only; it is not an investment recommendation.
        </p>
      </div>

      <Button className="mt-8" onClick={investigate}>
        Investigate
      </Button>
    </section>
  )
}
