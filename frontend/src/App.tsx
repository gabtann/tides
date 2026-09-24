import { BrowserRouter } from 'react-router'
import { AppRoutes } from './AppRoutes'
import { AppStateProvider } from './context/AppStateContext'

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <main className="mx-auto w-full max-w-[640px] px-4 py-8 sm:py-12">
          <AppRoutes />
        </main>
      </BrowserRouter>
    </AppStateProvider>
  )
}
