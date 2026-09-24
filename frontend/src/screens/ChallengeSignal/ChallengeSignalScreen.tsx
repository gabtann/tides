import { useParams } from 'react-router'
import { StubScreen } from '../../components/StubScreen'

export function ChallengeSignalScreen() {
  const { ticker = '' } = useParams()
  return <StubScreen title="Challenge Signal" ticker={ticker.toUpperCase()} />
}
