import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { INVESTIGATE_ERROR_MESSAGE, useInvestigation } from '../../hooks/useInvestigation'
import { Card } from '../../components/Card'
import { PriorityBadge } from '../../components/PriorityBadge'
import { StrengthIndicator } from '../../components/StrengthIndicator'

// Versi minimal. Loading per blok dan styling final menyusul (Hari 4).
export function InvestigationScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { status, result, error, errorCode, start } = useInvestigation(ticker)
  const navigate = useNavigate()

  // Cold open: layar ini memang tujuannya panggilan investigate, jadi langsung mulai.
  // Ref mencegah panggilan kedua dari effect ganda StrictMode.
  const autoStarted = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'idle' || autoStarted.current === ticker) return
    autoStarted.current = ticker
    void start()
  }, [status, ticker, start])

  return (
    <section>
      <BackLink to="/queue">Back to research queue</BackLink>
      <h1 className="mt-3 font-display text-[28px] leading-[34px] font-semibold">Investigation</h1>
      <p className="mt-2 font-semibold tabular-nums">{ticker}</p>

      <div className="card-staggermt-6 space-y-3">
        {(status === 'idle' || status === 'loading') && <LoadingState message={`Investigating ${ticker}…`} />}

        {status === 'error' && errorCode === 'NO_SIGNAL_FOUND' && (
          <div
            role="status"
            className="card-motion rounded-xl border border-line border-l-4 border-l-medium bg-surface p-4 text-fg"
          >
            <h2 className="font-semibold">No qualifying signal found for {ticker}</h2>
            <p className="mt-1 text-muted">
              This ticker may not currently meet the conditions for an investigation.
              Choose another signal from the Research Queue.
            </p>
          </div>
        )}

        {status === 'error' && errorCode !== 'NO_SIGNAL_FOUND' && (
          <ErrorState message={error ?? INVESTIGATE_ERROR_MESSAGE}>
            <Button onClick={() => void start()}>Retry</Button>
          </ErrorState>
        )}

        {result && (
          <>
            <Card className="border-l-4 border-l-brand">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-link">
                  Investigation complete
                </p>
                <h2 className="mt-1 font-display text-[20px] leading-[28px] font-semibold">
                  Evidence Brief ready
                </h2>
                <p className="mt-1 text-muted">
                  Review the full findings and limitations in the Evidence Brief.
                </p>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-line p-3">
                  <dt className="text-[13px] text-muted">Evidence strength</dt>
                  <dd className="mt-2">
                    <StrengthIndicator strength={result.evidenceStrength} />
                  </dd>
                </div>

                <div className="rounded-lg border border-line p-3">
                  <dt className="text-[13px] text-muted">Research priority</dt>
                  <dd className="mt-2">
                    <PriorityBadge priority={result.researchPriority} />
                  </dd>
                </div>
              </dl>
            </Card>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate(`/evidence/${ticker}`)}>
                View Evidence Brief
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/challenge/${ticker}`)}
              >
                Challenge signal
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}