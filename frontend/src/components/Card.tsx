import type { ReactNode } from 'react'

type Accent = 'high' | 'medium' | 'low' | 'none'

const ACCENT_CLASS: Record<Accent, string> = {
  high: 'border-l-4 border-l-high',
  medium: 'border-l-4 border-l-medium',
  low: 'border-l-4 border-l-low',
  none: '',
}

// Tanpa drop shadow: border 1px memisahkan kartu dari latar (StyleDesign §4).
export function Card({
  accent = 'none',
  className = '',
  children,
}: {
  accent?: Accent
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 text-fg ${ACCENT_CLASS[accent]} ${className}`}>
      {children}
    </div>
  )
}
