import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('test environment', () => {
  it('provides a working localStorage', () => {
    window.localStorage.setItem('probe', 'ok')
    expect(window.localStorage.getItem('probe')).toBe('ok')
  })

  it('renders the app shell on the watchlist', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'My Watchlist' })).toBeInTheDocument()
  })
})
