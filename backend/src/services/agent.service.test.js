// backend/src/services/agent.service.test.js
//
// Tests for investigate() which now:
//   1. Assembles Agent Input payload (3 cases)
//   2. Sends to AI Agent via runAgent()
//   3. Normalizes via buildEvidenceBrief()
//
// We mock global.fetch for Sectors API AND for the Agent call.
// The Agent call goes through agent.client.js which uses global.fetch
// to POST to ${config.agentBaseUrl}/investigate.
// Sectors calls go to ${config.sectorsBaseUrl}/v2/...
//
// Strategy: mock global.fetch to route based on URL patterns.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Menyediakan format flat & nested agar normalizer apapun pasti menemukannya
const mockOverview = {
  symbol: 'BBCA.JK',
  price: 8500,
  daily_price_change: 0.062,
  sector: 'Financials',
  overview: {
    price: 8500,
    daily_price_change: 0.062,
    price_date: '2026-09-26',
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
  details: { direction: 'UP', magnitude: 0.062 }
};

const fullContext = {
  currentPrice: 8500,
  dailyChange: 0.062,
  latestDate: '2026-09-26',
  sector: 'Financials',
  industry: 'Banks'
};

// Mock Evidence Brief response from the AI Agent (contract-compliant)
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

describe('investigate service (with Agent call)', () => {
  let originalFetch;
  let config;
  let agentService;
  let capturedAgentBody = null;

  beforeEach(async () => {
    originalFetch = global.fetch;

    // Ensure config.agentBaseUrl is set so runAgent doesn't throw NOT_CONFIGURED
    const configMod = await import('../config/env.js');
    config = configMod.config;
    config.agentBaseUrl = 'http://mock-agent:9999';

    // Re-import agent service (cached by ESM, but config is mutable)
    agentService = await import('./agent.service.js');

    capturedAgentBody = null;

    // Route fetch calls based on URL
    global.fetch = async (urlInput, opts) => {
      const urlStr = typeof urlInput === 'string' ? urlInput : (urlInput?.url || '');
      const url = String(urlStr).toLowerCase();

      // Agent call — POST to mock-agent
      if (url.includes('mock-agent') && url.includes('/investigate')) {
        capturedAgentBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockEvidenceBrief };
      }

      // Sectors calls
      if (url.includes('history') || url.includes('daily')) {
        return { ok: true, json: async () => mockHistory };
      }
      if (url.includes('peers') || url.includes('related')) {
        return { ok: true, json: async () => mockPeers };
      }

      // Fallback — overview/report
      return { ok: true, json: async () => mockOverview };
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (config) config.agentBaseUrl = '';
  });

  // ── Verify Evidence Brief shape ──────────────────────────────────────
  function assertEvidenceBriefShape(result) {
    assert.equal(typeof result.ticker, 'string', 'ticker harus string');
    assert.equal(typeof result.signal, 'string', 'signal harus string narasi');
    assert.ok(Array.isArray(result.observed), 'observed harus array');
    assert.ok(Array.isArray(result.compared), 'compared harus array');
    assert.ok(Array.isArray(result.interpreted), 'interpreted harus array');
    assert.ok(Array.isArray(result.unknown), 'unknown harus array');
    assert.ok(['STRONG', 'MODERATE', 'WEAK'].includes(result.evidenceStrength),
      'evidenceStrength harus STRONG/MODERATE/WEAK');
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(result.researchPriority),
      'researchPriority harus HIGH/MEDIUM/LOW');
    assert.equal(typeof result.generatedAt, 'string', 'generatedAt harus string ISO');
    assert.ok(result.limitation === null || typeof result.limitation === 'string',
      'limitation harus string | null');
  }

  test('case 1 (full payload) — calls Agent and returns Evidence Brief', async () => {
    const body = {
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    };
    const result = await agentService.investigate(body);

    // Result is Evidence Brief, NOT raw payload
    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.evidenceStrength, 'MODERATE');
    assert.equal(result.researchPriority, 'MEDIUM');

    // Verify callAgent was invoked with correct Agent Input payload
    assert.ok(capturedAgentBody, 'Agent harus dipanggil');
    assert.equal(capturedAgentBody.ticker, 'BBCA');
    assert.ok(capturedAgentBody.signal, 'Payload harus punya signal');
    assert.ok(capturedAgentBody.currentContext, 'Payload harus punya currentContext');
    assert.ok(Array.isArray(capturedAgentBody.availableTools), 'Payload harus punya availableTools');
  });

  test('case 2 (signal only, fetch currentContext) — enriches and calls Agent', async () => {
    const body = { ticker: 'BBCA', signal: mockSignal };
    const result = await agentService.investigate(body);

    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');

    // Verify Agent was called with enriched payload
    assert.ok(capturedAgentBody, 'Agent harus dipanggil');
    assert.equal(capturedAgentBody.ticker, 'BBCA');
    assert.ok(capturedAgentBody.currentContext, 'currentContext harus di-fetch dan dikirim');
    assert.ok('currentPrice' in capturedAgentBody.currentContext);
  });

  test('case 3 (fallback, detect signal) — runs signal engine then calls Agent', async () => {
    const body = { ticker: 'BBCA' };
    const result = await agentService.investigate(body);

    assertEvidenceBriefShape(result);
    assert.equal(result.ticker, 'BBCA');

    // Verify Agent was called
    assert.ok(capturedAgentBody, 'Agent harus dipanggil');
    assert.equal(capturedAgentBody.ticker, 'BBCA');
    assert.ok(capturedAgentBody.signal, 'signal harus terdeteksi oleh engine');
    assert.ok(capturedAgentBody.currentContext, 'currentContext harus terbentuk');
  });

  test('callAgent receives valid Agent Input Contract fields', async () => {
    const body = {
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    };
    await agentService.investigate(body);

    // Agent Input Contract: ticker, signal, currentContext, availableTools
    assert.ok(capturedAgentBody.ticker);
    assert.ok(capturedAgentBody.signal.type);
    assert.ok(capturedAgentBody.signal.priority);
    assert.ok(capturedAgentBody.signal.details);
    assert.ok(capturedAgentBody.currentContext.currentPrice !== undefined);
    assert.ok(capturedAgentBody.currentContext.dailyChange !== undefined);
    assert.deepEqual(capturedAgentBody.availableTools, ['getOverview', 'getHistorical', 'getPeers']);
  });
});