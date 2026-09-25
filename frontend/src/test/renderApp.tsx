import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect } from 'vitest'
import { AppRoutes } from '../AppRoutes'
import { AppStateProvider } from '../context/AppStateContext'
import { createMockTidesApi } from '../services/mockTidesApi'
import type { TidesApi } from '../services/tidesApi'

export function renderApp({
  route = '/',
  api = createMockTidesApi({ delayMs: 0 }),
}: { route?: string; api?: TidesApi } = {}) {
  const user = userEvent.setup()
  render(
    <AppStateProvider api={api}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </AppStateProvider>,
  )
  return { user }
}

// Watchlist dimuat async dari backend; tunggu sampai pesan loading hilang.
export async function watchlistLoaded() {
  await waitFor(() => expect(screen.queryByText('Loading your watchlist…')).not.toBeInTheDocument())
}
