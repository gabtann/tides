import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ScanResult } from '../../types/signal'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp, watchlistLoaded } from '../../test/renderApp'
import { seedScan, seedWatchlist } from '../../test/seed'

const DISCLAIMER = 'HIGH = research priority, not an investment recommendation.'
const at = '2026-09-23T12:00:00.000Z'
const storedScan: ScanResult = {
  scannedAt: at,
  signals: [
    { ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: at },
    { ticker: 'GOTO', priority: 'HIGH', reason: 'Volume spike well above 20-day average', detectedAt: at },
    { ticker: 'TLKM', priority: 'MEDIUM', reason: 'Price diverged from telecom peers', detectedAt: at },
  ],
}

const groupHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

async function scanFromWatchlist(tickers: string[]) {
  seedWatchlist(tickers)
  const controlled = createControlledApi()
  const { user } = renderApp({ api: controlled.api })
  await watchlistLoaded()
  await user.click(screen.getByRole('button', { name: 'Scan Watchlist' }))
  return { user, controlled }
}

describe('ResearchQueueScreen', () => {
  it('asks for a first scan when there is no result', async () => {
    renderApp({ route: '/queue' })
    await watchlistLoaded()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
    expect(screen.getByText(/No scan yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to watchlist' })).toHaveAttribute('href', '/')
  })

  it('shows loading, then groups signals by priority', async () => {
    const { controlled } = await scanFromWatchlist(['BBCA', 'BBRI', 'TLKM'])
    expect(screen.getByRole('status')).toHaveTextContent('Scanning 3 tickers…')
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()

    await controlled.resolveNext()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(groupHeadings()).toEqual(['High priority', 'Medium priority', 'Low priority'])
    expect(screen.getByRole('link', { name: /BBRI/ })).toHaveAttribute('href', '/signal/BBRI')
    expect(screen.getByText('Unusual price-volume movement')).toBeInTheDocument()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  })

  it('uses singular wording for a one-ticker scan', async () => {
    const { controlled } = await scanFromWatchlist(['BBRI'])
    expect(screen.getByRole('status')).toHaveTextContent('Scanning 1 ticker…')
    await controlled.resolveNext()
  })

  it('opens the signal detail for a clicked card, not the investigation', async () => {
    const { user, controlled } = await scanFromWatchlist(['BBRI'])
    await controlled.resolveNext()
    await user.click(screen.getByRole('link', { name: /BBRI/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'BBRI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Investigate' })).toBeInTheDocument()
    expect(controlled.calls.investigate).toBe(0)
  })

  it('shows a neutral message when nothing stands out', async () => {
    const { controlled } = await scanFromWatchlist(['UNVR'])
    await controlled.resolveNext()
    expect(screen.getByText('No significant changes across your watchlist.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  })

  it('recovers from a failed scan with Retry scan', async () => {
    const { user, controlled } = await scanFromWatchlist(['BBRI'])
    await controlled.rejectNext()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Scan failed: the TIDES service could not be reached. Check your connection and try again.',
    )
    expect(within(screen.getByRole('alert')).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry scan' }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    await controlled.resolveNext()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(groupHeadings()).toEqual(['High priority'])
  })

  it('restores the last scan after a reload', async () => {
    seedWatchlist(['BBRI', 'GOTO', 'TLKM'])
    seedScan(storedScan)
    renderApp({ route: '/queue' })
    await watchlistLoaded()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(groupHeadings()).toEqual(['High priority', 'Medium priority'])
    expect(screen.getByText(/3 tickers shown/)).toBeInTheDocument()
  })

  it('hides tickers removed from the watchlist since the scan', async () => {
    seedWatchlist(['BBRI', 'TLKM'])
    seedScan(storedScan)
    renderApp({ route: '/queue' })
    await watchlistLoaded()
    expect(screen.queryByText('GOTO')).not.toBeInTheDocument()
    expect(screen.getByText('BBRI')).toBeInTheDocument()
    expect(screen.getByText(/2 tickers shown/)).toBeInTheDocument()
  })

  it('shows the neutral message and disables Rescan when every scanned ticker was removed', async () => {
    seedWatchlist([])
    seedScan(storedScan)
    renderApp({ route: '/queue' })
    await watchlistLoaded()
    expect(screen.getByText('No significant changes across your watchlist.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /BBRI/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rescan' })).toBeDisabled()
  })

  it('ignores a second Rescan while a scan is running', async () => {
    seedWatchlist(['BBRI'])
    seedScan(storedScan)
    const controlled = createControlledApi()
    const { user } = renderApp({ route: '/queue', api: controlled.api })
    await watchlistLoaded()
    await user.dblClick(screen.getByRole('button', { name: 'Rescan' }))
    expect(controlled.calls.scanWatchlist).toBe(1)
    expect(screen.getByRole('button', { name: 'Rescan' })).toBeDisabled()
    await controlled.resolveNext()
  })

  it('waits for the watchlist before showing stored results', async () => {
    seedWatchlist(['BBRI', 'TLKM'])
    seedScan(storedScan)
    const controlled = createControlledApi({ hold: ['getWatchlist'] })
    renderApp({ route: '/queue', api: controlled.api })
    expect(screen.getByRole('status')).toHaveTextContent('Loading your watchlist…')
    expect(screen.queryByText('No significant changes across your watchlist.')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /BBRI/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rescan' })).toBeDisabled()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()

    await controlled.resolve('getWatchlist')
    expect(groupHeadings()).toEqual(['High priority', 'Medium priority'])
    expect(screen.getByRole('button', { name: 'Rescan' })).toBeEnabled()
  })

  it('offers Retry when the watchlist cannot be loaded', async () => {
    seedWatchlist(['BBRI'])
    seedScan(storedScan)
    const controlled = createControlledApi({ hold: ['getWatchlist'] })
    const { user } = renderApp({ route: '/queue', api: controlled.api })
    await controlled.reject('getWatchlist', 'Your watchlist could not be loaded. Check your connection and try again.')
    expect(screen.getByRole('alert')).toHaveTextContent('Your watchlist could not be loaded.')
    expect(screen.queryByRole('link', { name: /BBRI/ })).not.toBeInTheDocument()
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await controlled.resolve('getWatchlist')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /BBRI/ })).toBeInTheDocument()
  })
})

describe('ResearchQueueScreen back link', () => {
  // Tepat satu link "Back to watchlist" yang terlihat, menuju "/".
  function expectSingleBackLink() {
    const links = screen.getAllByRole('link', { name: 'Back to watchlist' })
    expect(links).toHaveLength(1)
    expect(links[0]).toBeVisible()
    expect(links[0]).toHaveAttribute('href', '/')
  }

  it('is there before any scan', async () => {
    renderApp({ route: '/queue' })
    await watchlistLoaded()
    expectSingleBackLink()
  })

  it('is there while scanning', async () => {
    const { controlled } = await scanFromWatchlist(['BBRI'])
    expect(screen.getByRole('status')).toHaveTextContent('Scanning 1 ticker…')
    expectSingleBackLink()
    await controlled.resolveNext()
  })

  it('is there when the scan fails', async () => {
    const { controlled } = await scanFromWatchlist(['BBRI'])
    await controlled.rejectNext()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expectSingleBackLink()
  })

  it('is there when nothing stands out', async () => {
    const { controlled } = await scanFromWatchlist(['UNVR'])
    await controlled.resolveNext()
    expect(screen.getByText('No significant changes across your watchlist.')).toBeInTheDocument()
    expectSingleBackLink()
  })

  it('is there with results', async () => {
    const { controlled } = await scanFromWatchlist(['BBRI'])
    await controlled.resolveNext()
    expect(groupHeadings()).toEqual(['High priority'])
    expectSingleBackLink()
  })

  it('takes the user back to the watchlist', async () => {
    const { user, controlled } = await scanFromWatchlist(['BBRI'])
    await controlled.resolveNext()
    await user.click(screen.getByRole('link', { name: 'Back to watchlist' }))
    expect(screen.getByRole('heading', { level: 1, name: 'My Watchlist' })).toBeInTheDocument()
  })
})

describe('ResearchQueueScreen signal cards', () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString()
  const cardScan = (): ScanResult => ({
    scannedAt: minutesAgo(12),
    signals: [
      { ticker: 'BBRI', priority: 'HIGH', reason: 'Unusual price-volume movement', detectedAt: minutesAgo(12) },
      { ticker: 'AAAA', priority: 'HIGH', reason: 'Price and volume moved well outside the recent range', detectedAt: minutesAgo(125) },
      { ticker: 'TLKM', priority: 'MEDIUM', reason: 'Price diverged from telecom peers', detectedAt: minutesAgo(12) },
    ],
  })

  async function renderCards() {
    seedWatchlist(['BBRI', 'AAAA', 'TLKM'])
    seedScan(cardScan())
    renderApp({ route: '/queue' })
    await watchlistLoaded()
  }

  const card = (ticker: string) => screen.getByRole('link', { name: new RegExp(`^${ticker}`) })

  it('shows the company name next to a known ticker', async () => {
    await renderCards()
    expect(within(card('BBRI')).getByText('Bank Rakyat Indonesia')).toBeInTheDocument()
    expect(within(card('TLKM')).getByText('Telkom Indonesia')).toBeInTheDocument()
  })

  it('shows only the ticker when the company is unknown', async () => {
    await renderCards()
    const unknown = card('AAAA')
    expect(within(unknown).getByText('AAAA')).toBeInTheDocument()
    expect(unknown.textContent).toBe(
      'AAAAHIGHPrice and volume moved well outside the recent range2h ago›',
    )
  })

  it('shows how long ago each signal was detected', async () => {
    await renderCards()
    expect(within(card('BBRI')).getByText('12m ago')).toBeInTheDocument()
    expect(within(card('AAAA')).getByText('2h ago')).toBeInTheDocument()
  })

  it('keeps the chevron decorative inside a single card link', async () => {
    await renderCards()
    const bbri = card('BBRI')
    const item = bbri.closest('li')!
    expect(within(item).getAllByRole('link')).toHaveLength(1)
    const chevron = within(bbri).getByText('›')
    expect(chevron).toHaveAttribute('aria-hidden', 'true')
    expect(chevron.tagName).toBe('SPAN')
    expect(chevron).not.toHaveAttribute('tabindex')
    expect(bbri.querySelectorAll('a, button, [tabindex]')).toHaveLength(0)
  })

  it('shows how many signals each group holds', async () => {
    await renderCards()
    expect(screen.getByText('2 items')).toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(groupHeadings()).toEqual(['High priority', 'Medium priority'])
  })
})
