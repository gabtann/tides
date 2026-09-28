import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroSection } from './HeroSection'

const TAGLINE = 'AI-Powered Intelligence for the Indonesian Stock Market.'
const PRINCIPLE = "Investigates the data. Doesn't predict prices or give financial advice."

describe('HeroSection', () => {
  it('groups the wordmark, tagline and principle in one centered section', () => {
    render(<HeroSection />)
    const hero = screen.getByRole('region', { name: 'Introduction' })
    expect(hero).toHaveClass('text-center')
    expect(within(hero).getByRole('img', { name: 'TIDES' })).toBeInTheDocument()
    expect(within(hero).getByText(TAGLINE)).toBeInTheDocument()
    expect(within(hero).getByText(PRINCIPLE)).toBeInTheDocument()
  })

  it('has no call to action', () => {
    render(<HeroSection />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('does not add another heading next to the screen title', () => {
    render(<HeroSection />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
