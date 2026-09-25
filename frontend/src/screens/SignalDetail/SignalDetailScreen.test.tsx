import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScanResult } from '../../types/signal'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp } from '../../test/renderApp'
import { seedScan } from '../../test/seed'

const DISCLAIMER = 'HIGH = research priority, not an investment recommendation.'
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString()
const storedScan = (): ScanResult => ({
  scannedAt: minutesAgo(12),
  signals: [
    { ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: minutesAgo(12) },
    { ticker: 'TLKM', priority: 'MEDIUM', reason: 'Price diverged from telecom peers', detectedAt: minutesAgo(125) },
  ],
})

function renderSignal(route: string) {
  const controlled = createControlledApi({ hold: ['investigate'] })
  const { user } = renderApp({ route, api: controlled.api })
  return { user, controlled }
}

describe('SignalDetailScreen', () => {
  it('shows the stored signal in full', () => {
    seedScan(storedScan())
    renderSignal('/signal/BBRI')
    expect(screen.getByRole('heading', { level: 1, name: 'BBRI' })).toBeInTheDocument()
    expect(screen.getByText('Bank Rakyat Indonesia')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('Unusual price-volume movement')).toBeInTheDocument()
    expect(screen.getByText('12m ago')).toBeInTheDocument()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Investigate' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Back to research queue' })).toHaveAttribute('href', '/queue')
  })

  it('matches the ticker regardless of URL case', () => {
    seedScan(storedScan())
    renderSignal('/signal/tlkm')
    expect(screen.getByRole('heading', { level: 1, name: 'TLKM' })).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  it('does not start an investigation just by opening the signal', () => {
    seedScan(storedScan())
    const { controlled } = renderSignal('/signal/BBRI')
    expect(controlled.calls.investigate).toBe(0)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    ['there is no stored scan', null],
    ['the ticker is not in the scan', storedScan()],
  ])('points back to the research queue when %s', (_, scan) => {
    if (scan) seedScan(scan)
    const { controlled } = renderSignal('/signal/GOTO')
    expect(screen.getByText(/This signal isn't loaded/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to research queue' })).toHaveAttribute('href', '/queue')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Investigate' })).not.toBeInTheDocument()
    expect(controlled.calls.investigate).toBe(0)
  })

  it('starts the investigation once and opens it in a loading state', async () => {
    seedScan(storedScan())
    const { user, controlled } = renderSignal('/signal/BBRI')
    await user.click(screen.getByRole('button', { name: 'Investigate' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Investigation' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Investigating BBRI…')
    expect(controlled.calls.investigate).toBe(1)

    await controlled.resolve('investigate')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'What changed?' })).toBeInTheDocument()
    expect(controlled.calls.investigate).toBe(1)
  })
})
