import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { StrengthIndicator } from '../../components/StrengthIndicator'
import { CHALLENGE_ERROR_MESSAGE, useChallenge } from '../../hooks/useChallenge'

export function ChallengeSignalScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { status, result, error, start } = useChallenge(ticker)
  const navigate = useNavigate()

  // Backend mengingat hasil investigasi (kontrak challenge(ticker)), jadi layar ini langsung mulai seperti Investigation.
  // Ref mencegah panggilan kedua dari effect ganda StrictMode.
  const autoStarted = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'idle' || autoStarted.current === ticker) return
    autoStarted.current = ticker
    void start()
  }, [status, ticker, start])

  return (
    <section>
      <BackLink to={`/investigate/${ticker}`}>Back to investigation</BackLink>
      <h1 className="mt-3 font-display text-[28px] leading-[34px] font-semibold">Challenge Signal</h1>
      <p className="mt-2 font-semibold tabular-nums">{ticker}</p>

      <div className="mt-6 space-y-3">
        {(status === 'idle' || status === 'loading') && <LoadingState message={`Challenging the ${ticker} signal…`} />}

        {status === 'error' && (
          <ErrorState message={error ?? CHALLENGE_ERROR_MESSAGE}>
            <Button onClick={() => void start()}>Retry</Button>
          </ErrorState>
        )}

        {result && (
          <>
            <Card>
              <h2 className="font-display text-[18px] leading-[24px] font-semibold">Initial signal</h2>
              <p className="mt-1">{result.initialSignal}</p>
            </Card>
            <Card>
              <h2 className="font-display text-[18px] leading-[24px] font-semibold">TIDES challenge</h2>
              <p className="mt-1">{result.challengeFinding}</p>
            </Card>
            <Card>
              <h2 className="font-display text-[18px] leading-[24px] font-semibold">Signal strength</h2>
              <p className="mt-1">
                <StrengthIndicator strength={result.signalStrength} />
              </p>
            </Card>
            <Button className="mt-5" onClick={() => navigate(`/evidence/${ticker}`)}>
              View evidence
            </Button>
          </>
        )}
      </div>
    </section>
  )
}