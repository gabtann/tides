import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp } from '../../test/renderApp'

const sectionHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

describe('EvidenceBriefScreen', () => {
  it('points to the challenge when the brief is not loaded, without calling the API', () => {
    const controlled = createControlledApi()
    renderApp({ route: '/evidence/bbri', api: controlled.api })
    expect(screen.getByText(/The evidence brief for BBRI isn't ready/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to challenge' })).toHaveAttribute('href', '/challenge/BBRI')
    expect(controlled.calls.challenge).toBe(0)
  })

  it('shows the brief from the finished challenge', async () => {
    const controlled = createControlledApi({ hold: ['challenge'] })
    const { user } = renderApp({ route: '/challenge/BBRI', api: controlled.api })
    await controlled.resolve('challenge')
    await user.click(screen.getByRole('button', { name: 'View evidence' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Evidence Brief' })).toBeInTheDocument()
    expect(sectionHeadings()).toEqual(['Observed', 'Compared', 'Interpreted', 'Unknown'])
    expect(screen.getByText('BBRI rose 6.2% over 5 days on 2.4x its 20-day average volume.')).toBeInTheDocument()
    expect(screen.getByText('The data does not show what caused the extra volume.')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText(/not an investment recommendation/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to challenge' })).toHaveAttribute('href', '/challenge/BBRI')
    expect(screen.getByRole('link', { name: 'Investigate another ticker' })).toHaveAttribute('href', '/queue')
    expect(screen.getByRole('link', { name: 'Back to watchlist' })).toHaveAttribute('href', '/')
    expect(controlled.calls.challenge).toBe(1)
  })
})