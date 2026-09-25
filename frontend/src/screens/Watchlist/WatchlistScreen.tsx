import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorState } from '../../components/ErrorState'
import { LoadingState } from '../../components/LoadingState'
import { WATCHLIST_LOAD_ERROR_MESSAGE } from '../../context/loadWatchlist'
import { useScan } from '../../hooks/useScan'
import { useWatchlist } from '../../hooks/useWatchlist'
import type { Ticker } from '../../types/ticker'

export function WatchlistScreen() {
  const { status, items, error: loadError, reload, add, remove } = useWatchlist()
  const { canScan, startScan } = useScan()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Ticker | null>(null)

  const loaded = status === 'success'
  const busy = adding || removing !== null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAdding(true)
    const message = await add(input)
    setAdding(false)
    setError(message)
    if (!message) setInput('')
  }

  async function handleRemove(ticker: Ticker) {
    setRemoving(ticker)
    setRemoveError(null)
    setRemoveError(await remove(ticker))
    setRemoving(null)
  }

  function handleScan() {
    void startScan()
    navigate('/queue')
  }

  return (
    <section>
      <h1 className="font-display text-[28px] leading-[34px] font-semibold">My Watchlist</h1>

      <div className="mt-6">
        {status === 'error' ? (
          <ErrorState message={loadError ?? WATCHLIST_LOAD_ERROR_MESSAGE}>
            <Button onClick={reload}>Retry</Button>
          </ErrorState>
        ) : !loaded ? (
          <LoadingState message="Loading your watchlist…" />
        ) : items.length === 0 ? (
          <p className="max-w-[60ch] text-muted">Add your first ticker, for example BBRI, to start scanning.</p>
        ) : (
          <>
            {removeError && (
              <p role="alert" className="mb-3 border-l-2 border-l-high pl-2 text-[13px] leading-[18px] text-fg">
                {removeError}
              </p>
            )}
            <Card className="p-0">
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.ticker} className="flex items-center justify-between px-4 py-3">
                    <span className="font-semibold tabular-nums">{item.ticker}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.ticker}`}
                      onClick={() => void handleRemove(item.ticker)}
                      disabled={removing !== null}
                      className="rounded-[10px] px-2 py-1 text-[13px] leading-[18px] text-muted hover:text-fg disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="mt-6">
        <label htmlFor="ticker-input" className="block text-[13px] leading-[18px] text-muted">
          Ticker
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="ticker-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setError(null)
            }}
            disabled={!loaded || adding}
            placeholder="BBRI"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'ticker-error' : undefined}
            className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-fg uppercase placeholder:text-muted disabled:opacity-60"
          />
          <Button type="submit" variant="secondary" className="shrink-0" disabled={!loaded || adding}>
            + Add Stock
          </Button>
        </div>
        {error && (
          <p id="ticker-error" className="mt-2 border-l-2 border-l-high pl-2 text-[13px] leading-[18px] text-fg">
            {error}
          </p>
        )}
      </form>

      <Button className="mt-8 w-full" onClick={handleScan} disabled={!canScan || busy}>
        Scan Watchlist
      </Button>
    </section>
  )
}
