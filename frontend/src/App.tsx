import { BrowserRouter, useLocation } from 'react-router'
import { AppRoutes } from './AppRoutes'
import { AppStateProvider } from './context/AppStateContext'

function AppLayout() {
  const { pathname } = useLocation()
  const isWatchlist = pathname === '/'

  return (
    <main
      className={`mx-auto w-full ${
        isWatchlist ? 'max-w-[1200px]' : 'max-w-[720px]'
      } px-4 py-8 sm:px-6 sm:py-12`}
    >
      <AppRoutes />
    </main>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppStateProvider>
  )
}