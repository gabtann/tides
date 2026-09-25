import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PriorityBadge } from './PriorityBadge'

describe('PriorityBadge', () => {
  it.each([
    ['HIGH', 'square'],
    ['MEDIUM', 'circle'],
    ['LOW', 'triangle'],
  ] as const)('shows %s with a %s shape', (priority, shape) => {
    const { container } = render(<PriorityBadge priority={priority} />)
    expect(screen.getByText(priority)).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('data-shape', shape)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
