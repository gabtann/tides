import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp } from '../../test/renderApp'

const sectionHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

function openBrief(route: string) {
  const controlled = createControlledApi({ hold: ['getEvidenceBrief'] })
  const { user } = renderApp({ route, api: controlled.api })
  return { user, controlled }
}

describe('EvidenceBriefScreen', () => {
  it('loads the brief on a cold open', async () => {
    const { controlled } = openBrief('/evidence/bbri')
    expect(screen.getByRole('heading', { level: 1, name: 'Evidence Brief' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Building the evidence brief for BBRI…')
    expect(screen.getByRole('link', { name: 'Back to challenge' })).toHaveAttribute('href', '/challenge/BBRI')
    expect(controlled.calls.getEvidenceBrief).toBe(1)
    await controlled.resolve('getEvidenceBrief')
  })

  it('shows every field of the Evidence Brief contract', async () => {
    const { controlled } = openBrief('/evidence/BBRI')
    await controlled.resolve('getEvidenceBrief')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(sectionHeadings()).toEqual(['Signal summary', 'Observed', 'Compared', 'Interpreted', 'Unknown', 'Limitation'])
    expect(screen.getByText('Unusual price-volume movement')).toBeInTheDocument()
    expect(screen.getByText('BBRI rose 6.2% over 5 days on 2.4x its 20-day average volume.')).toBeInTheDocument()
    expect(screen.getByText('The data does not show what caused the extra volume.')).toBeInTheDocument()
    expect(screen.getByText(/individual peer data was not retrieved/)).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText(/not an investment recommendation/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Investigate another ticker' })).toHaveAttribute('href', '/queue')
    expect(screen.getByRole('link', { name: 'Back to watchlist' })).toHaveAttribute('href', '/')
  })

  it('keeps missing evidence visible instead of hiding it', async () => {
    const { controlled } = openBrief('/evidence/UNVR')
    await controlled.resolve('getEvidenceBrief')

    expect(screen.getByText('No signal description was provided.')).toBeInTheDocument()
    expect(screen.getAllByText('No evidence available for this section.')).toHaveLength(3)
    expect(screen.getByText('Weak')).toBeInTheDocument()
  })

  it('shows the message from the backend and recovers with Retry', async () => {
    const { user, controlled } = openBrief('/evidence/BBRI')
    await controlled.reject('getEvidenceBrief', 'Agent service request timed out')
    expect(screen.getByRole('alert')).toHaveTextContent('Agent service request timed out')

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(controlled.calls.getEvidenceBrief).toBe(2)
    await controlled.resolve('getEvidenceBrief')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(sectionHeadings()).toHaveLength(6)
  })
})