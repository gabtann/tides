import { Link, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { PriorityBadge } from '../../components/PriorityBadge'
import { StrengthIndicator } from '../../components/StrengthIndicator'
import { useAppState } from '../../context/stateContext'

type SectionKey = 'observed' | 'compared' | 'interpreted' | 'unknown'

// Garis kiri per bagian (StyleDesign §6): data berwarna link, narasi agent brand, ketidakpastian kuning.
const SECTIONS: { key: SectionKey; label: string; border: string }[] = [
  { key: 'observed', label: 'Observed', border: 'border-l-link' },
  { key: 'compared', label: 'Compared', border: 'border-l-link' },
  { key: 'interpreted', label: 'Interpreted', border: 'border-l-brand' },
  { key: 'unknown', label: 'Unknown', border: 'border-l-medium' },
]

const generatedAtFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const linkClass = 'rounded text-link hover:underline hover:underline-offset-4'

// Brief ikut di ChallengeResult, jadi layar ini hanya membaca context dan tidak memanggil API.
export function EvidenceBriefScreen() {
  const ticker = (useParams().ticker ?? '').toUpperCase()
  const { state } = useAppState()
  const brief = state.challenges[ticker]?.result?.brief

  if (!brief) {
    return (
      <section>
        <p className="max-w-[60ch] text-muted">
          The evidence brief for {ticker} isn't ready. Run the challenge first to build it.
        </p>
        <Link to={`/challenge/${ticker}`} className={`mt-3 inline-block ${linkClass}`}>
          Go to challenge
        </Link>
      </section>
    )
  }

  return (
    <section>
      <BackLink to={`/challenge/${ticker}`}>Back to challenge</BackLink>
      <h1 className="mt-3 font-display text-[28px] leading-[34px] font-semibold">Evidence Brief</h1>
      <p className="mt-2 font-semibold tabular-nums">{ticker}</p>

      <div className="mt-6 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.key} aria-labelledby={`brief-${section.key}`} className={`border-l-2 pl-3 ${section.border}`}>
            <h2 id={`brief-${section.key}`} className="font-display text-[18px] leading-[24px] font-semibold">
              {section.label}
            </h2>
            <p className="mt-1 max-w-[60ch]">{brief[section.key]}</p>
          </section>
        ))}
      </div>

      <dl className="mt-8 space-y-3">
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

      <p className="mt-6 border-l-2 border-l-line pl-3 text-[13px] leading-[18px] text-muted">
        Research priority is not an investment recommendation. The final judgment is yours.
      </p>
      <p className="mt-2 text-[13px] leading-[18px] text-muted">
        Generated {generatedAtFormat.format(new Date(brief.generatedAt))}
      </p>

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