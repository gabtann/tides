/**
 * evidence.service.js
 *
 * Membangun EvidenceBrief dari output AI Agent.
 *
 * Kontrak output (selaras dengan types/evidenceBrief.ts di Frontend):
 *   ticker          : string | null
 *   signal          : string | null        — deskripsi sinyal yang dikivestigasi
 *   observed        : string[]             — fakta langsung dari data
 *   compared        : string[]             — perbandingan historis / peer
 *   interpreted     : string[]             — interpretasi yang didukung bukti
 *   unknown         : string[]             — hal yang tidak dapat dikonfirmasi
 *   evidenceStrength: 'STRONG'|'MODERATE'|'WEAK'   — selalu UPPERCASE
 *   researchPriority: 'HIGH'|'MEDIUM'|'LOW'         — untuk Frontend EvidenceBrief
 *   generatedAt     : string (ISO)
 *   limitation      : string | null
 */

const VALID_STRENGTHS = new Set(['STRONG', 'MODERATE', 'WEAK']);
const VALID_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);

/**
 * Normalisasi evidenceStrength ke uppercase.
 * Jika nilai tidak dikenali, fallback ke 'WEAK'.
 */
function normalizeStrength(raw) {
  if (typeof raw !== 'string') return 'WEAK';
  const up = raw.toUpperCase();
  return VALID_STRENGTHS.has(up) ? up : 'WEAK';
}

/**
 * Petakan evidenceStrength → researchPriority default:
 *   STRONG → HIGH, MODERATE → MEDIUM, WEAK → LOW
 * Dipakai sebagai fallback kalau agent tidak mengirim priority.
 */
function strengthToPriority(strength) {
  if (strength === 'STRONG') return 'HIGH';
  if (strength === 'MODERATE') return 'MEDIUM';
  return 'LOW';
}

/**
 * Normalisasi researchPriority ke uppercase.
 * Jika tidak valid, petakan dari evidenceStrength.
 */
function normalizePriority(raw, fallbackStrength) {
  if (typeof raw === 'string') {
    const up = raw.toUpperCase();
    if (VALID_PRIORITIES.has(up)) return up;
  }
  return strengthToPriority(fallbackStrength);
}

/**
 * Pastikan nilai bertipe array. Terima string maupun array dari agent.
 * String tunggal dibungkus jadi [string], bukan dibuang.
 */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

export function buildEvidenceBrief(agentResult) {
  if (!agentResult || typeof agentResult !== 'object') {
    throw new Error('Invalid agent result');
  }

  const evidenceStrength = normalizeStrength(agentResult.evidenceStrength);
  const researchPriority = normalizePriority(agentResult.researchPriority, evidenceStrength);

  // CP3 Evidence Brief fields — contract unchanged
  const brief = {
    ticker: agentResult.ticker || null,
    signal: agentResult.signal || null,
    observed: toArray(agentResult.observed),
    compared: toArray(agentResult.compared),
    interpreted: toArray(agentResult.interpreted),
    unknown: toArray(agentResult.unknown),
    evidenceStrength,
    researchPriority,
    generatedAt: agentResult.generatedAt ?? new Date().toISOString(),
    limitation: agentResult.limitation || null,
  };

  // CP4 Challenge Signal fields — pass-through, only if present in agent response.
  // No defaults are created; if Agent omits these, they stay absent from the output.
  if (agentResult.signalType !== undefined) {
    brief.signalType = agentResult.signalType;
  }
  if (agentResult.challenge !== undefined) {
    brief.challenge = agentResult.challenge;
  }
  if (agentResult.challengeStatus !== undefined) {
    brief.challengeStatus = agentResult.challengeStatus;
  }
  if (agentResult.confidence !== undefined) {
    brief.confidence = agentResult.confidence;
  }

  return brief;
}