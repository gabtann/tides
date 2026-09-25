import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { INVESTIGATE_ERROR_MESSAGE, useInvestigation } from '../../hooks/useInvestigation'
import type { ContextBlock } from '../../types/investigation'

// Versi minimal. Loading per blok dan styling final menyusul (Hari 4).
export function InvestigationScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { status, result, error, start } = useInvestigation(ticker)

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

      <div className="mt-6 space-y-3">
        {(status === 'idle' || status === 'loading') && <LoadingState message={`Investigating ${ticker}…`} />}

        {status === 'error' && (
          <ErrorState message={error ?? INVESTIGATE_ERROR_MESSAGE}>
            <Button onClick={() => void start()}>Retry</Button>
          </ErrorState>
        )}

        {result && (
          <>
            <ContextBlockCard block={result.whatChanged} />
            <ContextBlockCard block={result.historicalContext} />
            <ContextBlockCard block={result.peerContext} />
            <ContextBlockCard block={result.fundamentalContext} />
          </>
        )}
      </div>
    </section>
  )
}

function ContextBlockCard({ block }: { block: ContextBlock }) {
  return (
    <Card>
      <h2 className="font-display text-[18px] leading-[24px] font-semibold">{block.label}</h2>
      <p className="mt-1">{block.summary}</p>
      <dl className="mt-3 space-y-1 text-[13px] leading-[18px]">
        {Object.entries(block.dataPoints).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
