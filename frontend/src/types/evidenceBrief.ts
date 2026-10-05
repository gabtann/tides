import type { EvidenceStrength, ResearchPriority } from './priority'
import type { Ticker } from './ticker'


export const SignalType = {
  PRICE_MOVEMENT: 'PRICE_MOVEMENT',
  VOLUME_MOVEMENT: 'VOLUME_MOVEMENT',
  HISTORICAL_DEVIATION: 'HISTORICAL_DEVIATION',
  PEER_DIVERGENCE: 'PEER_DIVERGENCE',
} as const

export type SignalType = (typeof SignalType)[keyof typeof SignalType]

export type ChallengeStatus =
  | 'SUPPORTED'
  | 'WEAKENED'
  | 'CONTRADICTED'
  | 'INCONCLUSIVE'

export const Confidence = {
  STRONG: 'STRONG',
  MODERATE: 'MODERATE',
  WEAK: 'WEAK',
} as const

export type Confidence = (typeof Confidence)[keyof typeof Confidence]

export type ChallengeConfidence = Confidence

export interface ChallengeDetails {
  supporting: string[]
  contradicting: string[]
  alternativeExplanations: string[]
  unknown: string[]
}

// Mengikuti kontrak backend (docs/backend-api-contract.md, "Evidence Brief — Kontrak Respons Agent").
export interface EvidenceBrief {
  ticker: Ticker | null
  signal: string | null // narasi sinyal dari agent
  observed: string[] // fakta langsung dari data
  compared: string[] // perbandingan historis atau peer
  interpreted: string[] // interpretasi yang didukung bukti
  unknown: string[] // hal yang tidak dapat dikonfirmasi
  evidenceStrength: EvidenceStrength
  researchPriority: ResearchPriority
  generatedAt: string
  limitation: string | null

  // CP4.5 Additive Challenge Signal fields (optional untuk backward-compatibility dengan CP3)
  signalType?: SignalType
  challenge?: ChallengeDetails
  challengeStatus?: ChallengeStatus
  confidence?: Confidence
}