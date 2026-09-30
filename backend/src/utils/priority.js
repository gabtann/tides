// backend/src/utils/priority.js
/**
 * Select the signal with the highest priority.
 * Priority order: HIGH > MEDIUM > LOW.
 * Returns the first signal with the highest priority, or null if none.
 * This utility is only used in the fallback path of the investigation service.
 */
export function selectTopSignal(signals) {
  if (!Array.isArray(signals) || signals.length === 0) return null;
  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  let top = null;
  let topScore = 0;
  for (const sig of signals) {
    const score = priorityOrder[sig.priority] ?? 0;
    if (score > topScore) {
      topScore = score;
      top = sig;
    }
  }
  return top;
}
