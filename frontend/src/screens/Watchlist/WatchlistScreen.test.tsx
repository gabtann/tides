import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createControlledApi } from '../../test/controlledApi'
import { renderApp, watchlistLoaded } from '../../test/renderApp'
import { seedWatchlist } from '../../test/seed'

const tickerInput = () => screen.getByRole('textbox', { name: 'Ticker' })
const scanButton = () => screen.getByRole('button', { name: 'Scan Watchlist' })
const addButton = () => screen.getByRole('button', { name: '+ Add Stock' })
const storedTickers = () =>
  JSON.parse(window.localStorage.getItem('tides.mock.watchlist') ?? '[]').map((i: { ticker: string }) => i.ticker)

describe('WatchlistScreen', () => {
  it('shows loading while the watchlist is fetched, then the saved tickers', async () => {
    seedWatchlist(['BBRI'])
    const controlled = createControlledApi({ hold: ['getWatchlist'] })
    renderApp({ api: controlled.api })
    expect(screen.getByRole('status')).toHaveTextContent('Loading your watchlist…')
    expect(tickerInput()).toBeDisabled()
    expect(scanButton()).toBeDisabled()

    await controlled.resolve('getWatchlist')
    expect(within(screen.getByRole('list')).getByText('BBRI')).toBeInTheDocument()
    expect(scanButton()).toBeEnabled()
    expect(controlled.calls.getWatchlist).toBe(1)
  })

  it('offers Retry when the watchlist cannot be loaded', async () => {
    seedWatchlist(['BBRI'])
    const controlled = createControlledApi({ hold: ['getWatchlist'] })
    const { user } = renderApp({ api: controlled.api })
    await controlled.reject('getWatchlist', 'Your watchlist could not be loaded. Check your connection and try again.')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your watchlist could not be loaded. Check your connection and try again.',
    )
    expect(scanButton()).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await controlled.resolve('getWatchlist')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(within(screen.getByRole('list')).getByText('BBRI')).toBeInTheDocument()
  })

  it('invites the first ticker and disables Scan when empty', async () => {
    renderApp()
    await watchlistLoaded()
    expect(screen.getByRole('heading', { level: 1, name: 'My Watchlist' })).toBeInTheDocument()
    expect(screen.getByText('Add your first ticker, for example BBRI, to start scanning.')).toBeInTheDocument()
    expect(scanButton()).toBeDisabled()
  })

  it('adds a trimmed, uppercased ticker through the backend and clears the input', async () => {
    const { user } = renderApp()
    await watchlistLoaded()
    await user.type(tickerInput(), '  bbri {Enter}')
    expect(await within(await screen.findByRole('list')).findByText('BBRI')).toBeInTheDocument()
    expect(tickerInput()).toHaveValue('')
    expect(scanButton()).toBeEnabled()
    expect(storedTickers()).toEqual(['BBRI'])
  })

  it('waits for the backend before showing an added ticker', async () => {
    const controlled = createControlledApi({ hold: ['addTicker'] })
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.type(tickerInput(), 'TLKM')
    await user.click(addButton())
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(tickerInput()).toBeDisabled()
    expect(addButton()).toBeDisabled()

    await controlled.resolve('addTicker')
    expect(within(screen.getByRole('list')).getByText('TLKM')).toBeInTheDocument()
    expect(tickerInput()).toBeEnabled()
  })

  it('disables Scan while a watchlist change is pending', async () => {
    seedWatchlist(['BBRI'])
    const controlled = createControlledApi({ hold: ['addTicker'] })
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.type(tickerInput(), 'TLKM{Enter}')
    expect(scanButton()).toBeDisabled()
    await controlled.resolve('addTicker')
    expect(scanButton()).toBeEnabled()
  })

  it('shows the format error inline without calling the backend', async () => {
    const controlled = createControlledApi()
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.type(tickerInput(), 'BB{Enter}')
    expect(tickerInput()).toHaveAccessibleDescription('Ticker must be 4 letters, for example BBRI.')
    expect(tickerInput()).toHaveValue('BB')
    expect(controlled.calls.addTicker).toBe(0)
  })

  it('rejects a duplicate ticker', async () => {
    seedWatchlist(['BBRI'])
    const { user } = renderApp()
    await watchlistLoaded()
    await user.type(tickerInput(), 'bbri{Enter}')
    expect(tickerInput()).toHaveAccessibleDescription('BBRI is already in your watchlist.')
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(1)
  })

  it('passes a backend rejection through unchanged', async () => {
    const { user } = renderApp()
    await watchlistLoaded()
    await user.type(tickerInput(), 'zzzz{Enter}')
    expect(await screen.findByText('ZZZZ is not listed on IDX.')).toBeInTheDocument()
    expect(tickerInput()).toHaveAccessibleDescription('ZZZZ is not listed on IDX.')
    expect(tickerInput()).toHaveValue('zzzz')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('clears the error when the user edits the input', async () => {
    const { user } = renderApp()
    await watchlistLoaded()
    await user.type(tickerInput(), 'BB{Enter}')
    await user.type(tickerInput(), 'R')
    expect(screen.queryByText('Ticker must be 4 letters, for example BBRI.')).not.toBeInTheDocument()
  })

  it('removes a ticker through the backend', async () => {
    seedWatchlist(['BBRI', 'TLKM'])
    const controlled = createControlledApi({ hold: ['removeTicker'] })
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.click(screen.getByRole('button', { name: 'Remove BBRI' }))
    expect(screen.getByRole('button', { name: 'Remove BBRI' })).toBeDisabled()

    await controlled.resolve('removeTicker')
    expect(screen.queryByText('BBRI')).not.toBeInTheDocument()
    expect(storedTickers()).toEqual(['TLKM'])
  })

  it('keeps the ticker and shows an alert when removing fails', async () => {
    seedWatchlist(['BBRI'])
    const controlled = createControlledApi({ hold: ['removeTicker'] })
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.click(screen.getByRole('button', { name: 'Remove BBRI' }))
    await controlled.reject('removeTicker', 'BBRI could not be removed. Check your connection and try again.')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'BBRI could not be removed. Check your connection and try again.',
    )
    expect(screen.getByRole('button', { name: 'Remove BBRI' })).toBeEnabled()
  })

  it('starts a scan and moves to the queue', async () => {
    seedWatchlist(['BBRI', 'TLKM'])
    const controlled = createControlledApi()
    const { user } = renderApp({ api: controlled.api })
    await watchlistLoaded()
    await user.click(scanButton())
    expect(controlled.calls.scanWatchlist).toBe(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Research Queue' })).toBeInTheDocument()
    await controlled.resolveNext()
  })
})
