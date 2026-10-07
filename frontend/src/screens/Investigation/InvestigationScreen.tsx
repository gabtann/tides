import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { INVESTIGATE_ERROR_MESSAGE, useInvestigation } from '../../hooks/useInvestigation'
import { BriefContent } from '../EvidenceBrief/EvidenceBriefScreen'

// Versi minimal. Loading per blok dan styling final menyusul (Hari 4).
export function InvestigationScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { status, result, error, start } = useInvestigation(ticker)
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

      <div className="mt-6 space-y-3">
        {(status === 'idle' || status === 'loading') && <LoadingState message={`Investigating ${ticker}…`} />}

        {status === 'error' && (
          <ErrorState message={error ?? INVESTIGATE_ERROR_MESSAGE}>
            <Button onClick={() => void start()}>Retry</Button>
          </ErrorState>
        )}

        {result && (
          <>
            <BriefContent brief={result} />
            <Button className="mt-5" onClick={() => navigate(`/challenge/${ticker}`)}>
              Challenge signal
            </Button>
          </>
        )}
      </div>
    </section>
  )
}