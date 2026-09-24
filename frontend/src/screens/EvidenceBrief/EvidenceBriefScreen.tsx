import { useParams } from 'react-router'
import { StubScreen } from '../../components/StubScreen'

export function EvidenceBriefScreen() {
  const { ticker = '' } = useParams()
  return <StubScreen title="Evidence Brief" ticker={ticker.toUpperCase()} />
}
