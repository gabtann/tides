// backend/src/services/agent.service.test.js
//
// Tests for investigate() â€” full integration flow:
//   Assemble Agent Input payload â†’ send to Agent (mocked) â†’ normalize via buildEvidenceBrief()
//
// Mock strategy: global.fetch is intercepted to route Sectors vs Agent calls by URL pattern.
// The Agent call body is captured and asserted for contract compliance.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockOverview = {
  symbol: 'BBCA.JK',
  company_name: 'Bank Central Asia',
  overview: {
    last_close_price: 8500,
    daily_close_change: 0.062,
    latest_close_date: '2026-09-26',
    sector: 'Financials',
    industry: 'Banks',
    sub_industry: 'Banks'
  }
};

const mockHistory = [
  { date: '2026-09-24', close: 8000, close_price: 8000, volume: 1000000 },
  { date: '2026-09-25', close: 8000, close_price: 8000, volume: 1000000 },
  { date: '2026-09-26', close: 8500, close_price: 8500, volume: 2500000 }
];

const mockPeers = [
  { symbol: 'BBNI.JK', company_name: 'Bank Negara' }
];

const mockSignal = {
  type: 'PRICE_MOVEMENT',
  priority: 'HIGH',
  description: 'Price moved up',
  details: { direction: 'UP', magnitude: 6.2 } // <--- KEMBALIKAN KE 6.2
};

const fullContext = {
  currentPrice: 8500,
  dailyChange: 0.062, // <--- BIARKAN TETAP 0.062
  latestDate: '2026-09-26',
  sector: 'Financials',
  industry: 'Banks'
};

const mockEvidenceBrief = {
  ticker: 'BBCA',
  signal: 'Price moved 6.2% in one day',
  observed: ['BBCA rose 6.2% on 2026-09-26'],
  compared: ['Sector peers rose 1.1% on average'],
  interpreted: ['Movement appears specific to BBCA'],
  unknown: ['Cause of volume spike not confirmed'],
  evidenceStrength: 'MODERATE',
  researchPriority: 'MEDIUM',
  generatedAt: '2026-09-26T18:23:57.209Z',
  limitation: null
};

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function assertEvidenceBriefShape(result) {
  assert.equal(typeof result.ticker, 'string');
  assert.equal(typeof result.signal, 'string');
  assert.ok(Array.isArray(result.observed));
  assert.ok(Array.isArray(result.compared));
  assert.ok(Array.isArray(result.interpreted));
  assert.ok(Array.isArray(result.unknown));
  assert.ok(['STRONG', 'MODERATE', 'WEAK'].includes(result.evidenceStrength));
  assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(result.researchPriority));
  assert.equal(typeof result.generatedAt, 'string');
  assert.ok(result.limitation === null || typeof result.limitation === 'string');
}

function assertAgentInputPayload(payload, expectedDailyChange, expectedMagnitude) {
  // Top-level fields
  assert.equal(payload.ticker, 'BBCA');
  assert.deepEqual(payload.availableTools, ['getOverview', 'getHistorical', 'getPeers']);

  // signal contract
  assert.equal(typeof payload.signal.type, 'string');
  assert.ok(payload.signal.type.length > 0, 'signal.type must be non-empty');
  assert.equal(typeof payload.signal.priority, 'string');
  assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(payload.signal.priority));
  assert.ok(payload.signal.details, 'signal.details must exist');
  assert.equal(typeof payload.signal.details.magnitude, 'number');
  assert.equal(payload.signal.details.magnitude, expectedMagnitude);

  // currentContext contract
  assert.ok(payload.currentContext, 'currentContext must exist');
  assert.equal(typeof payload.currentContext.currentPrice, 'number');
  assert.equal(typeof payload.currentContext.dailyChange, 'number');
  assert.equal(payload.currentContext.dailyChange, expectedDailyChange);
  assert.equal(typeof payload.currentContext.latestDate, 'string');
}

// â”€â”€ Test Suite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('investigate service', () => {
  let originalFetch;
  let config;
  let agentService;
  let capturedAgentBody = null;

  beforeEach(async () => {
    originalFetch = global.fetch;

    const configMod = await import('../config/env.js');
    config = configMod.config;
    config.agentBaseUrl = 'http://mock-agent:9999';

    agentService = await import('./agent.service.js');
    capturedAgentBody = null;

    global.fetch = async (urlInput, opts) => {
      const urlStr = typeof urlInput === 'string' ? urlInput : (urlInput?.url || '');
      const url = String(urlStr).toLowerCase();

      // Agent call
      if (url.includes('mock-agent') && url.includes('/investigate')) {
        capturedAgentBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockEvidenceBrief };
      }
      // Sectors: history
      if (url.includes('history') || url.includes('daily')) {
        return { ok: true, json: async () => mockHistory };
      }
      // Sectors: peers
      if (url.includes('peers') || url.includes('related')) {
        return { ok: true, json: async () => mockPeers };
      }
      // Sectors: overview (fallback)
      return { ok: true, json: async () => mockOverview };
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (config) config.agentBaseUrl = '';
  });

  // â”€â”€ Case 1: Full payload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  test('case 1 â€” full payload: builds correct Agent Input and returns Evidence Brief', async () => {
    const result = await agentService.investigate({
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    });

    // 1. Return value is Evidence Brief
    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.evidenceStrength, 'MODERATE');

    // 2. Agent was called with correct payload
    assert.ok(capturedAgentBody, 'runAgent must have been called');
    assertAgentInputPayload(capturedAgentBody, 0.062, 6.2);
  });

  // â”€â”€ Case 2: Signal only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  test('case 2 â€” signal only: fetches currentContext, builds payload, calls Agent', async () => {
    const result = await agentService.investigate({
      ticker: 'BBCA',
      signal: mockSignal,
    });

    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');

    assert.ok(capturedAgentBody, 'runAgent must have been called');
    // signal comes from body (same mockSignal), currentContext from live fetch
    assert.equal(capturedAgentBody.signal.type, 'PRICE_MOVEMENT');
    assert.equal(capturedAgentBody.signal.priority, 'HIGH');
    assert.equal(capturedAgentBody.signal.details.magnitude, 6.2);
    assert.deepEqual(capturedAgentBody.availableTools, ['getOverview', 'getHistorical', 'getPeers']);
    assert.ok(capturedAgentBody.currentContext, 'currentContext must be enriched from Sectors');
    assert.equal(typeof capturedAgentBody.currentContext.dailyChange, 'number');
    assert.equal(typeof capturedAgentBody.currentContext.currentPrice, 'number');
  });

  // â”€â”€ Case 3: Fallback (no signal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  test('case 3 â€” fallback: detects signal via engine, builds payload, calls Agent', async () => {
    const result = await agentService.investigate({ ticker: 'BBCA' });

    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');

    assert.ok(capturedAgentBody, 'runAgent must have been called');
    assert.equal(capturedAgentBody.ticker, 'BBCA');

    // Signal was detected by engine â€” type and priority must be present
    assert.equal(typeof capturedAgentBody.signal.type, 'string');
    assert.ok(capturedAgentBody.signal.type.length > 0);
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(capturedAgentBody.signal.priority));
    assert.ok(capturedAgentBody.signal.details, 'signal.details must exist');
    assert.equal(typeof capturedAgentBody.signal.details.magnitude, 'number');

    // currentContext must be present and numeric
    assert.ok(capturedAgentBody.currentContext);
    assert.equal(typeof capturedAgentBody.currentContext.currentPrice, 'number');
    assert.equal(typeof capturedAgentBody.currentContext.dailyChange, 'number');

    assert.deepEqual(capturedAgentBody.availableTools, ['getOverview', 'getHistorical', 'getPeers']);
  });

  // â”€â”€ CP4: Agent returns Challenge Signal fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  test('CP4 â€” Agent returns Challenge fields: evidence brief includes challenge AND preserves CP3 fields', async () => {
    // Override Agent mock to return Challenge fields alongside Evidence Brief
    const mockWithChallenge = {
      ...mockEvidenceBrief,
      signalType: 'PRICE_MOVEMENT',
      challenge: {
        supporting: ['Volume confirms price movement'],
        contradicting: ['Sector moved similarly'],
        alternativeExplanations: ['Market-wide rally on same day'],
        unknown: ['Corporate action not confirmed'],
      },
      challengeStatus: 'SUPPORTED',
      confidence: 'MODERATE',
    };

    global.fetch = async (urlInput, opts) => {
      const urlStr = typeof urlInput === 'string' ? urlInput : (urlInput?.url || '');
      const url = String(urlStr).toLowerCase();
      if (url.includes('mock-agent') && url.includes('/investigate')) {
        capturedAgentBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockWithChallenge };
      }
      return { ok: true, json: async () => mockOverview };
    };

    const result = await agentService.investigate({
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    });

    // CP3 fields must remain intact
    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.signal, 'Price moved 6.2% in one day');
    assert.deepEqual(result.observed, ['BBCA rose 6.2% on 2026-09-26']);
    assert.deepEqual(result.compared, ['Sector peers rose 1.1% on average']);
    assert.deepEqual(result.interpreted, ['Movement appears specific to BBCA']);
    assert.deepEqual(result.unknown, ['Cause of volume spike not confirmed']);
    assert.equal(result.evidenceStrength, 'MODERATE');
    assert.equal(result.researchPriority, 'MEDIUM');
    assert.equal(result.generatedAt, '2026-09-26T18:23:57.209Z');
    assert.equal(result.limitation, null);

    // CP4 Challenge fields must be present and passed through as-is
    assert.equal(result.signalType, 'PRICE_MOVEMENT');
    assert.deepEqual(result.challenge, mockWithChallenge.challenge);
    assert.equal(result.challengeStatus, 'SUPPORTED');
    assert.equal(result.confidence, 'MODERATE');
  });

  // â”€â”€ CP4: Agent does NOT return Challenge fields (backward compat) â”€â”€

  test('CP4 â€” Agent omits Challenge fields: response valid, no forced defaults', async () => {
    // Use original mockEvidenceBrief which has NO Challenge fields
    const result = await agentService.investigate({
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    });

    // CP3 fields must remain intact
    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.evidenceStrength, 'MODERATE');

    // Challenge fields must NOT exist in the response (not null, not undefined â€” absent)
    assert.equal('signalType' in result, false, 'signalType must not be present when Agent omits it');
    assert.equal('challenge' in result, false, 'challenge must not be present when Agent omits it');
    assert.equal('challengeStatus' in result, false, 'challengeStatus must not be present when Agent omits it');
    assert.equal('confidence' in result, false, 'confidence must not be present when Agent omits it');
  });
});
