import assert from 'node:assert/strict';
import test from 'node:test';

import { validateChallengeInput } from './challenge.service.js';

const evidenceBrief = {
  ticker: 'BBCA',
  signal: 'Price movement requires further investigation.',
  observed: ['BBCA price increased by 6.2%.'],
  compared: ['Peer average change was 1.1%.'],
  interpreted: [
    'The price movement was materially larger than the peer average.',
  ],
  unknown: [
    'The cause of the price movement cannot be confirmed from the available evidence.',
  ],
  evidenceStrength: 'MODERATE',
  researchPriority: 'HIGH',
  generatedAt: '2026-10-05T10:00:00Z',
  limitation: 'Causal explanation requires additional evidence.',
};

test('challenge.service — accepts valid challenge input', () => {
  const result = validateChallengeInput({
    ticker: 'bbca',
    signalType: 'PRICE_MOVEMENT',
    evidenceBrief,
  });

  assert.deepStrictEqual(result, {
    ticker: 'BBCA',
    signalType: 'PRICE_MOVEMENT',
    evidenceBrief,
  });
});

test('challenge.service — normalizes ticker to uppercase', () => {
  const result = validateChallengeInput({
    ticker: '  goto  ',
    signalType: 'PRICE_MOVEMENT',
    evidenceBrief,
  });

  assert.strictEqual(result.ticker, 'GOTO');
});

test('challenge.service — rejects missing input', () => {
  assert.throws(
    () => validateChallengeInput(),
    {
      message: 'Challenge input is required.',
    }
  );
});

test('challenge.service — rejects missing ticker', () => {
  assert.throws(
    () =>
      validateChallengeInput({
        signalType: 'PRICE_MOVEMENT',
        evidenceBrief,
      }),
    {
      message: 'ticker is required.',
    }
  );
});

test('challenge.service — rejects unsupported signal type', () => {
  assert.throws(
    () =>
      validateChallengeInput({
        ticker: 'BBCA',
        signalType: 'UNKNOWN_SIGNAL',
        evidenceBrief,
      }),
    {
      message: 'Unsupported signalType: UNKNOWN_SIGNAL.',
    }
  );
});

test('challenge.service — rejects missing evidence brief', () => {
  assert.throws(
    () =>
      validateChallengeInput({
        ticker: 'BBCA',
        signalType: 'PRICE_MOVEMENT',
      }),
    {
      message: 'evidenceBrief is required.',
    }
  );
});