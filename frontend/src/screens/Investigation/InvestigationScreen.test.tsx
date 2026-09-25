import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../AppRoutes'
import { AppStateProvider } from '../../context/AppStateContext'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp, watchlistLoaded } from '../../test/renderApp'
import { seedScan, seedWatchlist } from '../../test/seed'

const at = '2026-09-23T12:00:00.000Z'
const blockHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

function openInvestigation(route: string) {
  const controlled = createControlledApi({ hold: ['investigate'] })
  const { user } = renderApp({ route, api: controlled.api })
  return { user, controlled }
}

describe('InvestigationScreen', () => {
  it('starts the investigation on a cold open', async () => {
    const { controlled } = openInvestigation('/investigate/bbri')
    expect(screen.getByRole('heading', { level: 1, name: 'Investigation' })).toBeInTheDocument()
    expect(screen.getByText('BBRI')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Investigating BBRI…')
    expect(screen.getByRole('link', { name: 'Back to research queue' })).toHaveAttribute('href', '/queue')
    expect(controlled.calls.investigate).toBe(1)

    await controlled.resolve('investigate')
    expect(controlled.calls.investigate).toBe(1)
  })

  // main.tsx memakai StrictMode, yang menjalankan effect dua kali di dev.
  it('starts only once under StrictMode', async () => {
    const controlled = createControlledApi({ hold: ['investigate'] })
    render(
      <StrictMode>
        <AppStateProvider api={controlled.api}>
          <MemoryRouter initialEntries={['/investigate/BBRI']}>
            <AppRoutes />
          </MemoryRouter>
        </AppStateProvider>
      </StrictMode>,
    )
    expect(controlled.calls.investigate).toBe(1)
    await controlled.resolve('investigate')
  })

  it('shows the four context blocks when done', async () => {
    const { controlled } = openInvestigation('/investigate/BBRI')
    await controlled.resolve('investigate')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(blockHeadings()).toEqual(['What changed?', 'Historical context', 'Peer context', 'Fundamental context'])
    expect(screen.getByText('BBRI moved outside its recent trading range.')).toBeInTheDocument()
    expect(screen.getByText('Volume vs 20d average')).toBeInTheDocument()
    expect(screen.getByText('2.4x')).toBeInTheDocument()
  })

  it('recovers from a failed investigation with Retry', async () => {
    const { user, controlled } = openInvestigation('/investigate/BBRI')
    await controlled.reject('investigate')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Investigation failed: the TIDES service could not be reached. Check your connection and try again.',
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByRole('status')).toHaveTextContent('Investigating BBRI…')
    expect(controlled.calls.investigate).toBe(2)
    await controlled.resolve('investigate')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(blockHeadings()).toHaveLength(4)
  })

  it('reuses a finished investigation when the ticker is opened again', async () => {
    seedWatchlist(['BBRI'])
    seedScan({
      scannedAt: at,
      signals: [{ ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: at }],
    })
    const { user, controlled } = openInvestigation('/signal/BBRI')
    await user.click(screen.getByRole('button', { name: 'Investigate' }))
    await controlled.resolve('investigate')

    await user.click(screen.getByRole('link', { name: 'Back to research queue' }))
    await watchlistLoaded()
    await user.click(screen.getByRole('link', { name: /BBRI/ }))
    await user.click(screen.getByRole('button', { name: 'Investigate' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(blockHeadings()).toHaveLength(4)
    expect(controlled.calls.investigate).toBe(1)
  })
})
