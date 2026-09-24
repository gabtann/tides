import { Navigate, Route, Routes } from 'react-router'
import { ChallengeSignalScreen } from './screens/ChallengeSignal/ChallengeSignalScreen'
import { EvidenceBriefScreen } from './screens/EvidenceBrief/EvidenceBriefScreen'
import { InvestigationScreen } from './screens/Investigation/InvestigationScreen'
import { ResearchQueueScreen } from './screens/ResearchQueue/ResearchQueueScreen'
import { SignalDetailScreen } from './screens/SignalDetail/SignalDetailScreen'
import { WatchlistScreen } from './screens/Watchlist/WatchlistScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WatchlistScreen />} />
      <Route path="/queue" element={<ResearchQueueScreen />} />
      <Route path="/signal/:ticker" element={<SignalDetailScreen />} />
      <Route path="/investigate/:ticker" element={<InvestigationScreen />} />
      <Route path="/challenge/:ticker" element={<ChallengeSignalScreen />} />
      <Route path="/evidence/:ticker" element={<EvidenceBriefScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
