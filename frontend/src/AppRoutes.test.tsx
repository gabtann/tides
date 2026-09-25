import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

describe('routes', () => {
  it.each([
    ['/challenge/BBRI', 'Challenge Signal'],
    ['/evidence/BBRI', 'Evidence Brief'],
  ])('%s renders the %s stub for the ticker', (route, title) => {
    renderApp({ route })
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByText('BBRI')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to research queue' })).toHaveAttribute('href', '/queue')
  })

  it('renders the research queue at /queue', () => {
    renderApp({ route: '/queue' })
    expect(screen.getByRole('heading', { level: 1, name: 'Research Queue' })).toBeInTheDocument()
  })

  it('redirects unknown paths to the watchlist', () => {
    renderApp({ route: '/nope' })
    expect(screen.getByRole('heading', { level: 1, name: 'My Watchlist' })).toBeInTheDocument()
  })
})
