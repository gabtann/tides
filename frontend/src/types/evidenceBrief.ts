import type { EvidenceStrength, ResearchPriority } from './priority'
import type { Ticker } from './ticker'

export interface EvidenceBrief {
  ticker: Ticker
  observed: string
  compared: string
  interpreted: string
  unknown: string
  evidenceStrength: EvidenceStrength
  researchPriority: ResearchPriority
  generatedAt: string
}
