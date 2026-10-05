import assert from 'node:assert/strict';
import test from 'node:test';

import { challengeEvidence } from './challenge-reasoning.service.js';

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

const input = {
  ticker: 'BBCA',
  signalType: 'PRICE_MOVEMENT',
  evidenceBrief,
};

const evidence = {
  getHistorical: [
    {
      ticker: 'BBCA',
      date: '2026-09-30',
      open: 6100,
      high: 6150,
      low: 6050,
      close: 6075,
      volume: 221335700,
    },
  ],
  getPeers: [
    {
      ticker: 'BBRI',
      yearly_mcap_change: -0.18,
    },
    {
      ticker: 'BMRI',
      yearly_mcap_change: -0.08,
    },
  ],
};

function mockGenerateText(response) {
  return async () => response;
}

test('challenge reasoning — parses and normalizes valid response', async () => {
  const generateText = mockGenerateText(
    JSON.stringify({
      signalSummary: 'BBCA price increased by 6.2% in one day.',
      challengeSummary:
        'The movement appears materially larger than the peer comparison.',
      generatedAt: '2026-10-05T10:10:00Z',
      challenge: {
        supporting: [
          'BBCA increased by 6.2%, materially above the peer average.',
        ],
        contradicting: [],
        alternativeExplanations: [],
        unknown: [
          'The cause of the price movement cannot be confirmed.',
        ],
      },
      challengeStatus: 'SUPPORTED',
      confidence: 'MODERATE',
      limitation: 'Causal evidence is unavailable.',
    })
  );

  const result = await challengeEvidence(input, evidence, {
    generateText,
  });

  assert.strictEqual(result.ticker, 'BBCA');
  assert.strictEqual(result.signalType, 'PRICE_MOVEMENT');
  assert.strictEqual(
    result.signalSummary,
    'BBCA price increased by 6.2% in one day.'
  );
  assert.strictEqual(result.challengeStatus, 'SUPPORTED');
  assert.strictEqual(result.confidence, 'MODERATE');

  assert.ok(Array.isArray(result.challenge.supporting));
  assert.ok(Array.isArray(result.challenge.contradicting));
  assert.ok(Array.isArray(result.challenge.alternativeExplanations));
  assert.ok(Array.isArray(result.challenge.unknown));
});

test('challenge reasoning — invalid status falls back to INCONCLUSIVE', async () => {
  const generateText = mockGenerateText(
    JSON.stringify({
      signalSummary: 'BBCA price increased by 6.2%.',
      challengeSummary: 'Insufficient evidence for a firm challenge conclusion.',
      generatedAt: '2026-10-05T10:10:00Z',
      challenge: {},
      challengeStatus: 'INVALID_STATUS',
      confidence: 'INVALID_CONFIDENCE',
      limitation: null,
    })
  );

  const result = await challengeEvidence(input, evidence, {
    generateText,
  });

  assert.strictEqual(result.challengeStatus, 'INCONCLUSIVE');
  assert.strictEqual(result.confidence, 'WEAK');
});

test('challenge reasoning — invalid JSON throws AGENT_INVALID_JSON', async () => {
  const generateText = mockGenerateText('this is not valid json');

  await assert.rejects(
    () =>
      challengeEvidence(input, evidence, {
        generateText,
      }),
    (error) => error.code === 'AGENT_INVALID_JSON'
  );
});