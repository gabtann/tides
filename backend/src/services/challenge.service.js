const SUPPORTED_SIGNAL_TYPES = new Set([
  'PRICE_MOVEMENT',
  'VOLUME_MOVEMENT',
  'HISTORICAL_DEVIATION',
  'PEER_DIVERGENCE',
]);

function createChallengeError(message, code = 'INVALID_CHALLENGE_INPUT') {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}

export function validateChallengeInput(input) {
  if (!input || typeof input !== 'object') {
    throw createChallengeError('Challenge input is required.');
  }

  const { ticker, signalType, evidenceBrief } = input;

  if (typeof ticker !== 'string' || !ticker.trim()) {
    throw createChallengeError('ticker is required.');
  }

  if (!SUPPORTED_SIGNAL_TYPES.has(signalType)) {
    throw createChallengeError(
      `Unsupported signalType: ${signalType ?? 'undefined'}.`
    );
  }

  if (!evidenceBrief || typeof evidenceBrief !== 'object') {
    throw createChallengeError('evidenceBrief is required.');
  }

  return {
    ticker: ticker.trim().toUpperCase(),
    signalType,
    evidenceBrief,
  };
}