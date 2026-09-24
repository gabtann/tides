import type { ReactNode } from 'react'
import type { ResearchPriority } from '../types/priority'

// Pill terisi warna prioritas, teks dan bentuk warna canvas. Bentuk berbeda per level
// supaya prioritas tidak hanya terbaca dari warna.
const SHAPES: Record<ResearchPriority, { name: string; fill: string; node: ReactNode }> = {
  HIGH: { name: 'square', fill: 'bg-high', node: <rect x="1" y="1" width="8" height="8" /> },
  MEDIUM: { name: 'circle', fill: 'bg-medium', node: <circle cx="5" cy="5" r="4" /> },
  LOW: { name: 'triangle', fill: 'bg-low', node: <polygon points="5,1 9,9 1,9" /> },
}

export function PriorityBadge({ priority }: { priority: ResearchPriority }) {
  const shape = SHAPES[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold text-canvas ${shape.fill}`}
    >
      <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor" aria-hidden="true" data-shape={shape.name}>
        {shape.node}
      </svg>
      {priority}
    </span>
  )
}
