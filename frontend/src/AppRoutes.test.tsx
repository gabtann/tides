import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

describe('routes', () => {
  it('renders the research queue at /queue', () => {
    renderApp({ route: '/queue' })
    expect(screen.getByRole('heading', { level: 1, name: 'Research Queue' })).toBeInTheDocument()
  })

  it('redirects unknown paths to the watchlist', () => {
    renderApp({ route: '/nope' })
    expect(screen.getByRole('heading', { level: 1, name: 'My Watchlist' })).toBeInTheDocument()
  })
})
