import type { EvidenceStrength } from '../types/priority'

const LABEL: Record<EvidenceStrength, string> = { STRONG: 'Strong', MODERATE: 'Moderate', WEAK: 'Weak' }
const SHAPE: Record<EvidenceStrength, string> = { STRONG: 'full', MODERATE: 'half', WEAK: 'outline' }
// Lingkaran isi penuh, separuh, atau garis luar saja (StyleDesign §6), supaya kekuatan tidak hanya terbaca dari teks.
export function StrengthIndicator({ strength }: { strength: EvidenceStrength }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" data-shape={SHAPE[strength]}>
        <circle
          cx="5"
          cy="5"
          r="4"
          fill={strength === 'STRONG' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {strength === 'MODERATE' && <path d="M5 1 A4 4 0 0 0 5 9 Z" fill="currentColor" />}
      </svg>
      {LABEL[strength]}
    </span>
  )
}