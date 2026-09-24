import type { EvidenceBrief } from './evidenceBrief'
import type { EvidenceStrength } from './priority'
import type { Ticker } from './ticker'

export interface ChallengeResult {
  ticker: Ticker
  initialSignal: string
  challengeFinding: string // contoh: "Peer stocks also showed similar movement."
  signalStrength: EvidenceStrength
  brief: EvidenceBrief // evidence brief ikut di response challenge, bukan endpoint terpisah
}
