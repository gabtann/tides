import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { PriorityBadge } from '../../components/PriorityBadge'
import { StrengthIndicator } from '../../components/StrengthIndicator'
import { EVIDENCE_BRIEF_ERROR_MESSAGE, useEvidenceBrief } from '../../hooks/useEvidenceBrief'
import type { EvidenceBrief } from '../../types/evidenceBrief'

type SectionKey = 'observed' | 'compared' | 'interpreted' | 'unknown'

// Garis kiri per bagian (StyleDesign §6): data berwarna link, narasi agent brand, ketidakpastian kuning.
const SECTIONS: { key: SectionKey; label: string; border: string }[] = [
  { key: 'observed', label: 'Observed', border: 'border-l-link' },
  { key: 'compared', label: 'Compared', border: 'border-l-link' },
  { key: 'interpreted', label: 'Interpreted', border: 'border-l-brand' },
  { key: 'unknown', label: 'Unknown', border: 'border-l-medium' },
]

const headingClass = 'font-display text-[18px] leading-[24px] font-semibold'
const generatedAtFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const linkClass = 'rounded text-link hover:underline hover:underline-offset-4'

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

// Prinsip kontrak: bukti yang tidak ada harus tetap terlihat, jadi field kosong diberi keterangan, bukan disembunyikan.
function BriefContent({ brief }: { brief: EvidenceBrief }) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="brief-signal">
        <h2 id="brief-signal" className={headingClass}>
          Signal
        </h2>
        <p className="mt-1 max-w-[60ch]">{brief.signal ?? 'No signal description was provided.'}</p>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.key} aria-labelledby={`brief-${section.key}`} className={`border-l-2 pl-3 ${section.border}`}>
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

      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Evidence strength</dt>
          <dd>
            <StrengthIndicator strength={brief.evidenceStrength} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Research priority</dt>
          <dd>
            <PriorityBadge priority={brief.researchPriority} />
          </dd>
        </div>
      </dl>

      <section aria-labelledby="brief-limitation">
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