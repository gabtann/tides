import { Link } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { SignalCard } from '../../components/SignalCard'
import { WATCHLIST_LOAD_ERROR_MESSAGE } from '../../context/loadWatchlist'
import { SCAN_ERROR_MESSAGE, useScan } from '../../hooks/useScan'
import { useWatchlist } from '../../hooks/useWatchlist'
import type { ResearchPriority } from '../../types/priority'
import { selectQueueGroups } from '../../utils/queue'

const GROUP_HEADING: Record<ResearchPriority, string> = {
  HIGH: 'High priority',
  MEDIUM: 'Medium priority',
  LOW: 'Low priority',
}

const GROUP_DOT: Record<ResearchPriority, string> = {
  HIGH: 'bg-high',
  MEDIUM: 'bg-medium',
  LOW: 'bg-low',
}

const scannedAtFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

const tickers = (count: number) => `${count} ${count === 1 ? 'ticker' : 'tickers'}`
const itemCount = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`

export function ResearchQueueScreen() {
  const { status: watchlistStatus, items, error: watchlistError, reload } = useWatchlist()
  const { status, result, error, canScan, startScan } = useScan()
  const isScanning = status === 'loading'
  // Filter ke watchlist baru bermakna setelah watchlist dimuat dari backend.
  const watchlistReady = watchlistStatus === 'success'
  const groups = result && watchlistReady ? selectQueueGroups(result, items) : []
  const shownCount = groups.reduce((total, group) => total + group.signals.length, 0)
  const rescan = () => void startScan()

  return (
    <section>
      <BackLink to="/">Back to watchlist</BackLink>
      <header className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-[34px] font-semibold">Research Queue</h1>
          {result && watchlistReady && (
            <p className="mt-1 text-[13px] leading-[18px] text-muted">
              {tickers(shownCount)} shown · Scanned {scannedAtFormat.format(new Date(result.scannedAt))}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={rescan} disabled={!canScan}>
          Rescan
        </Button>
      </header>

      <p className="mt-4 border-l-2 border-l-line pl-3 text-[13px] leading-[18px] text-muted">
        HIGH = research priority, not an investment recommendation.
      </p>

      <div className="mt-6 space-y-8">
        {isScanning && <LoadingState message={`Scanning ${tickers(items.length)}…`} />}

        {status === 'error' && (
          <ErrorState message={error ?? SCAN_ERROR_MESSAGE}>
            <Button onClick={rescan} disabled={!canScan}>
              Retry scan
            </Button>
          </ErrorState>
        )}

        {watchlistStatus === 'error' ? (
          <ErrorState message={watchlistError ?? WATCHLIST_LOAD_ERROR_MESSAGE}>
            <Button onClick={reload}>Retry</Button>
          </ErrorState>
        ) : !watchlistReady ? (
          <LoadingState message="Loading your watchlist…" />
        ) : result ? (
          groups.length > 0 ? (
            groups.map((group) => (
              <section key={group.priority} aria-labelledby={`group-${group.priority}`}>
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className={`size-2 rounded-full ${GROUP_DOT[group.priority]}`} />
                  <h2 id={`group-${group.priority}`} className="font-display text-[18px] leading-[24px] font-semibold">
                    {GROUP_HEADING[group.priority]}
                  </h2>
                  <span className="rounded-full border border-line px-2 text-[13px] leading-[18px] text-muted">
                    {itemCount(group.signals.length)}
                  </span>
                </div>
                <ul className="mt-3 space-y-3">
                  {group.signals.map((signal) => (
                    <li key={signal.ticker}>
                      <SignalCard signal={signal} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className="text-muted">No significant changes across your watchlist.</p>
          )
        ) : (
          status === 'idle' && (
            <div>
              <p className="max-w-[60ch] text-muted">
                No scan yet. Run a scan from your watchlist to see which tickers need a closer look.
              </p>
              <Link to="/" className="mt-3 inline-block rounded text-link hover:underline hover:underline-offset-4">
                Go to watchlist
              </Link>
            </div>
          )
        )}
      </div>
    </section>
  )
}
