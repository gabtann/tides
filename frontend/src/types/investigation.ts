import type { Ticker } from './ticker'

export interface ContextBlock {
  label: string
  summary: string
  dataPoints: Record<string, string | number>
}

export interface InvestigationResult {
  ticker: Ticker
  whatChanged: ContextBlock
  historicalContext: ContextBlock
  peerContext: ContextBlock
  fundamentalContext: ContextBlock
}
