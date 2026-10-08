import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { PriorityBadge } from '../../components/PriorityBadge'
import { StrengthIndicator } from '../../components/StrengthIndicator'
import { EVIDENCE_BRIEF_ERROR_MESSAGE, useEvidenceBrief } from '../../hooks/useEvidenceBrief'
import type { ChallengeDetails, ChallengeStatus, EvidenceBrief } from '../../types/evidenceBrief'

type SectionKey = 'observed' | 'compared' | 'interpreted' | 'unknown'

// Garis kiri per bagian (StyleDesign §6): data berwarna link, narasi agent brand, ketidakpastian kuning.
const SECTIONS: { key: SectionKey; label: string; border: string }[] = [
  { key: 'observed', label: 'Observed', border: 'border-l-link' },
  { key: 'compared', label: 'Compared', border: 'border-l-link' },
  { key: 'interpreted', label: 'Interpreted', border: 'border-l-brand' },
  { key: 'unknown', label: 'Unknown', border: 'border-l-medium' },
]

const CHALLENGE_STATUS_STYLE: Record<ChallengeStatus, string> = {
  SUPPORTED: 'bg-low/20 text-low border border-low/40',
  WEAKENED: 'bg-medium/20 text-medium border border-medium/40',
  CONTRADICTED: 'bg-high/20 text-high border border-high/40',
  INCONCLUSIVE: 'bg-surface text-muted border border-line',
}

const CHALLENGE_QUADRANTS: {
  key: keyof ChallengeDetails
  label: string
  border: string
}[] = [
  { key: 'supporting', label: 'Supporting Evidence', border: 'border-l-low' },
  { key: 'contradicting', label: 'Contradicting Evidence', border: 'border-l-high' },
  { key: 'alternativeExplanations', label: 'Alternative Explanations', border: 'border-l-brand' },
  { key: 'unknown', label: 'Unknowns', border: 'border-l-medium' },
]

const headingClass = 'font-display text-[18px] leading-[24px] font-semibold'
const generatedAtFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const linkClass = 'rounded text-link hover:underline hover:underline-offset-4'

function formatSignalLabel(signal: string | null): string {
  if (!signal) return 'No signal description was provided.'
  if (!/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(signal)) return signal

  return signal
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function EvidenceBriefScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { status, result, error, start } = useEvidenceBrief(ticker)

  // Brief dimuat sendiri (kontrak POST /api/agent/investigate), jadi layar ini langsung mulai seperti Investigation.
  // Ref mencegah panggilan kedua dari effect ganda StrictMode.
  const autoStarted = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'idle' || autoStarted.current === ticker) return
    autoStarted.current = ticker
    void start()
  }, [status, ticker, start])

  return (
    <section>
      <BackLink to={`/challenge/${ticker}`}>Back to challenge</BackLink>
      <h1 className="mt-3 font-display text-[28px] leading-[34px] font-semibold">Evidence Brief</h1>
      <p className="mt-2 font-semibold tabular-nums">{ticker}</p>

      <div className="mt-6">
        {(status === 'idle' || status === 'loading') && (
          <LoadingState message={`Building the evidence brief for ${ticker}…`} />
        )}

        {status === 'error' && (
          <ErrorState message={error ?? EVIDENCE_BRIEF_ERROR_MESSAGE}>
            <Button onClick={() => void start()}>Retry</Button>
          </ErrorState>
        )}

        {result && <BriefContent brief={result} />}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
        <Link to="/queue" className={linkClass}>
          Investigate another ticker
        </Link>
        <Link to="/" className={linkClass}>
          Back to watchlist
        </Link>
      </div>
    </section>
  )
}

function ChallengeSection({ brief }: { brief: EvidenceBrief }) {
  if (!brief.challenge) return null

  return (
    <section
      aria-labelledby="brief-challenge"
      className="space-y-4 rounded-xl border border-line bg-surface p-4 text-fg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 id="brief-challenge" className={headingClass}>
            Challenge Signal
          </h2>
          {brief.signalType && (
            <p className="mt-0.5 text-[13px] text-muted">
              Signal type: <span className="font-mono text-fg">{brief.signalType}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {brief.challengeStatus && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                CHALLENGE_STATUS_STYLE[brief.challengeStatus] ?? 'border border-line bg-surface text-muted'
              }`}
            >
              {brief.challengeStatus}
            </span>
          )}
          {brief.confidence && (
            <span className="inline-flex items-center rounded-full border border-line bg-canvas/60 px-2.5 py-0.5 text-[12px] text-muted">
              Confidence: <span className="ml-1 font-semibold text-fg">{brief.confidence}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHALLENGE_QUADRANTS.map((quadrant) => {
          const items = brief.challenge?.[quadrant.key] ?? []
          return (
            <div key={quadrant.key} className={`border-l-2 pl-3 ${quadrant.border}`}>
              <h3 className="text-[14px] font-semibold text-fg">{quadrant.label}</h3>
              {items.length > 0 ? (
                <ul className="mt-1 list-disc space-y-1 pl-4 text-[14px]">
                  {items.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[14px] text-muted">None identified.</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Prinsip kontrak: bukti yang tidak ada harus tetap terlihat, jadi field kosong diberi keterangan, bukan disembunyikan.
export function BriefContent({ brief }: { brief: EvidenceBrief }) {
    return (
    <div className="space-y-6">
      <section
        aria-labelledby="brief-signal"
        className="rounded-xl border border-line border-l-4 border-l-link bg-surface p-4"
      >
        <h2 id="brief-signal" className="text-[13px] font-semibold uppercase tracking-wide text-link">
          Signal summary
        </h2>
        <p className="mt-1 max-w-[60ch] font-display text-[20px] leading-[28px] font-medium">
          {formatSignalLabel(brief.signal)}
        </p>
      </section>

      {brief.challenge && <ChallengeSection brief={brief} />}

      {SECTIONS.map((section) => (
        <section key={section.key} aria-labelledby={`brief-${section.key}`} className={`rounded-xl border border-line border-l-4 bg-surface p-4 ${section.border}`}>
          <h2 id={`brief-${section.key}`} className={headingClass}>
            {section.label}
          </h2>
          {brief[section.key].length > 0 ? (
            <ul className="mt-1 max-w-[60ch] list-disc space-y-1 pl-5">
              {brief[section.key].map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-muted">No evidence available for this section.</p>
          )}
        </section>
      ))}

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-[13px] text-muted">Evidence strength</dt>
          <dd className="mt-2">
            <StrengthIndicator strength={brief.evidenceStrength} />
          </dd>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-[13px] text-muted">Research priority</dt>
          <dd className="mt-2">
            <PriorityBadge priority={brief.researchPriority} />
          </dd>
        </div>
      </dl>

      <section
        aria-labelledby="brief-limitation"
        className="rounded-xl border border-medium/30 border-l-4 border-l-medium bg-medium/10 p-4">
        <h2 id="brief-limitation" className={headingClass}>
          Limitation
        </h2>
        <p className="mt-1 max-w-[60ch]">{brief.limitation ?? 'No limitation was reported.'}</p>
      </section>

      <div>
        <p className="border-l-2 border-l-line pl-3 text-[13px] leading-[18px] text-muted">
          Research priority is not an investment recommendation. The final judgment is yours.
        </p>
        <p className="mt-2 text-[13px] leading-[18px] text-muted">
          Generated {generatedAtFormat.format(new Date(brief.generatedAt))}
        </p>
      </div>
    </div>
  )
}