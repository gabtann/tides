import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpTidesApi } from './httpTidesApi'

const BASE = 'http://localhost:4000'
const api = createHttpTidesApi(BASE)

const fetchMock = vi.fn<typeof fetch>()

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url, method: init?.method, body: init?.body ? JSON.parse(init.body as string) : undefined }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  return () => vi.unstubAllGlobals()
})

describe('getWatchlist', () => {
  it('unwraps data.watchlist and maps symbol/added_at to ticker/addedAt', async () => {
    respond(200, {
      success: true,
      data: { watchlist: [{ symbol: 'BBRI', added_at: '2026-09-25T01:00:00.000Z' }] },
    })

    expect(await api.getWatchlist()).toEqual([{ ticker: 'BBRI', addedAt: '2026-09-25T01:00:00.000Z' }])
    expect(lastCall()).toMatchObject({ url: `${BASE}/api/watchlist`, method: 'GET' })
  })

  it('ignores a trailing slash in the base URL', async () => {
    respond(200, { success: true, data: { watchlist: [] } })
    await createHttpTidesApi(`${BASE}/`).getWatchlist()
    expect(lastCall().url).toBe(`${BASE}/api/watchlist`)
  })
})

describe('addTicker', () => {
  it('posts the ticker as symbol', async () => {
    respond(201, { success: true, data: { symbol: 'TLKM', added_at: '2026-09-25T01:00:00.000Z' } })
    await api.addTicker('TLKM')
    expect(lastCall()).toEqual({ url: `${BASE}/api/watchlist`, method: 'POST', body: { symbol: 'TLKM' } })
  })

  it('rejects with the backend error.message', async () => {
    respond(400, {
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: "Symbol 'BBRI' already in watchlist" },
    })
    await expect(api.addTicker('BBRI')).rejects.toThrow("Symbol 'BBRI' already in watchlist")
  })
})

describe('removeTicker', () => {
  it('deletes by URL-encoded ticker', async () => {
    respond(200, { success: true, data: {} })
    await api.removeTicker('BB/RI')
    expect(lastCall()).toMatchObject({ url: `${BASE}/api/watchlist/BB%2FRI`, method: 'DELETE' })
  })
})

describe('scanWatchlist', () => {
  const SCANNED_AT = '2026-09-25T02:00:00.000Z'
  const unavailable = { code: 'SECTORS_UNAVAILABLE', message: 'Sectors API is unavailable', symbol: 'BBCA' }

  function respondScan(errors: unknown[] = []) {
    respond(200, {
      success: true,
      data: { scanned_at: SCANNED_AT, symbols_scanned: 1, signals_detected: 0, queue: [], errors },
    })
  }

  function respondSignals(signals: unknown[]) {
    respond(200, { success: true, data: { signals } })
  }

  it('posts /scan, then gets /signals and maps them to Signal', async () => {
    respondScan()
    respondSignals([
      { ticker: 'BBCA', type: 'PRICE_CHANGE', direction: 'UP', magnitude: '5.20%', raw_value: 0.052 },
      { ticker: 'BBCA', type: 'VOLUME_SPIKE', magnitude: '2.3x average', raw_value: 2.3 },
    ])

    expect(await api.scanWatchlist()).toEqual({
      scannedAt: SCANNED_AT,
      signals: [
        { ticker: 'BBCA', priority: 'MEDIUM', reason: 'PRICE_CHANGE 5.20%', detectedAt: SCANNED_AT },
        { ticker: 'BBCA', priority: 'MEDIUM', reason: 'VOLUME_SPIKE 2.3x average', detectedAt: SCANNED_AT },
      ],
    })
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`${BASE}/api/scan`, 'POST'],
      [`${BASE}/api/signals`, 'GET'],
    ])
  })

  it('rejects with the first backend error when the scan produced errors and no signals', async () => {
    respondScan([unavailable])
    respondSignals([])
    await expect(api.scanWatchlist()).rejects.toThrow('Sectors API is unavailable')
  })

  it('still returns signals when only some symbols failed, and warns about the failures', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    respondScan([unavailable])
    respondSignals([{ ticker: 'TLKM', type: 'NEAR_90D_HIGH', magnitude: '97.1% of 90d range' }])

    const result = await api.scanWatchlist()

    expect(result.signals.map((s) => s.ticker)).toEqual(['TLKM'])
    expect(warn).toHaveBeenCalledWith(expect.any(String), [unavailable])
    warn.mockRestore()
  })

  it('returns an empty queue when nothing changed and nothing failed', async () => {
    respondScan()
    respondSignals([])
    expect(await api.scanWatchlist()).toEqual({ scannedAt: SCANNED_AT, signals: [] })
  })

  it('treats a scan response without an errors field as no errors', async () => {
    respond(200, { success: true, data: { scanned_at: SCANNED_AT, symbols_scanned: 1, signals_detected: 1, queue: [] } })
    respondSignals([{ ticker: 'BBCA', type: 'PRICE_CHANGE', direction: 'UP', magnitude: '5.20%', raw_value: 0.052 }])

    expect(await api.scanWatchlist()).toEqual({
      scannedAt: SCANNED_AT,
      signals: [{ ticker: 'BBCA', priority: 'MEDIUM', reason: 'PRICE_CHANGE 5.20%', detectedAt: SCANNED_AT }],
    })
  })

  it('does not fetch signals when the scan request fails', async () => {
    respond(500, { success: false, error: { code: 'INTERNAL', message: 'Scan crashed' } })
    await expect(api.scanWatchlist()).rejects.toThrow('Scan crashed')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('errors', () => {
  it('reports an unreachable server', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(api.getWatchlist()).rejects.toThrow(/can't reach the TIDES server/i)
  })

  it('rejects when success is false even with a 200 status', async () => {
    respond(200, { success: false, error: { code: 'X', message: 'Something broke' } })
    await expect(api.getWatchlist()).rejects.toThrow('Something broke')
  })

  it('falls back to a status message when the body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Not Found</html>', { status: 404 }))
    await expect(api.getWatchlist()).rejects.toThrow('The server responded with an error (404).')
  })

  it('keeps investigate and challenge unimplemented', async () => {
    await expect(api.investigate('BBRI')).rejects.toThrow('not implemented: investigate')
    await expect(api.challenge('BBRI')).rejects.toThrow('not implemented: challenge')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
