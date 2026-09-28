export function buildEvidenceBrief(agentResult) {
  if (!agentResult || typeof agentResult !== 'object') {
    throw new Error('Invalid agent result');
  }

  return {
    ticker: agentResult.ticker || null,
    signal: agentResult.signal || null,
    observed: agentResult.observed || [],
    compared: agentResult.compared || [],
    interpreted: agentResult.interpreted || [],
    unknown: agentResult.unknown || [],
    evidenceStrength: agentResult.evidenceStrength || 'Weak',
    limitation: agentResult.limitation || null,
  };
}