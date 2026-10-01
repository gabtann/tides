import type { EvidenceStrength, ResearchPriority } from './priority'
import type { Ticker } from './ticker'

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
}