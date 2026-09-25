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

      <p className="mt-6 text-[18px] leading-[26px]">{signal.reason}</p>
      <p className="mt-2 text-[13px] leading-[18px] text-muted">{formatRelativeTime(signal.detectedAt)}</p>

      <p className="mt-6 border-l-2 border-l-line pl-3 text-[13px] leading-[18px] text-muted">
        HIGH = research priority, not an investment recommendation.
      </p>

      <Button className="mt-8" onClick={investigate}>
        Investigate
      </Button>
    </section>
  )
}
