import type { EvidenceStrength } from './priority'
import type { Ticker } from './ticker'

export interface ChallengeResult {
  ticker: Ticker
  initialSignal: string
  challengeFinding: string // contoh: "Peer stocks also showed similar movement."
  signalStrength: EvidenceStrength
}
