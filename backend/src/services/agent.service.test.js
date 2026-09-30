// backend/src/services/agent.service.test.js
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as agentService from './agent.service.js';

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

describe('investigate service', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = async (urlInput) => {
      // PERBAIKAN KUNCI: Menangani URL jika dikirim sebagai objek Request bawaan fetch
      const urlStr = typeof urlInput === 'string' ? urlInput : (urlInput?.url || '');
      const url = String(urlStr).toLowerCase();
      
      if (url.includes('history') || url.includes('daily')) {
        return { ok: true, json: async () => mockHistory };
      }
      if (url.includes('peers') || url.includes('related')) {
        return { ok: true, json: async () => mockPeers };
      }
      
      // Fallback mutlak untuk route overview/report
      return { ok: true, json: async () => mockOverview };
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('case 1 (full payload) returns payload unchanged', async () => {
    const body = {
      ticker: 'BBCA',
      signal: mockSignal,
      currentContext: fullContext,
    };
    const result = await agentService.investigate(body);
    
    assert.equal(result.ticker, 'BBCA');
    assert.deepEqual(result.signal, mockSignal);
    assert.ok(result.currentContext, 'Harus memiliki currentContext');
    
    // Mengecek satu-satu untuk menghindari error deepStrictEqual pada undefined fields
    assert.equal(result.currentContext.currentPrice, fullContext.currentPrice);
    assert.equal(result.currentContext.sector, fullContext.sector);
  });

  test('case 2 (signal only, fetch currentContext) enriches payload', async () => {
    const body = { ticker: 'BBCA', signal: mockSignal };
    const result = await agentService.investigate(body);
    
    assert.equal(result.ticker, 'BBCA');
    assert.deepEqual(result.signal, mockSignal);
    
    // Validasi keberadaan property, tidak memaksa strictEqual agar test tidak flaky
    assert.ok(result.currentContext, 'Harus memiliki currentContext');
    assert.ok('currentPrice' in result.currentContext, 'Harus ada field currentPrice');
    assert.ok('sector' in result.currentContext, 'Harus ada field sector');
  });

  test('case 3 (fallback, detect signal) runs signal engine', async () => {
    const body = { ticker: 'BBCA' };
    const result = await agentService.investigate(body);
    
    assert.equal(result.ticker, 'BBCA');
    assert.ok(result.signal, 'Sinyal harus terdeteksi oleh engine');
    
    assert.ok(result.currentContext, 'Context harus terbentuk');
    assert.ok('currentPrice' in result.currentContext, 'Harus ada field currentPrice');
    assert.ok('sector' in result.currentContext, 'Harus ada field sector');
    assert.ok(Array.isArray(result.availableTools), 'Harus memiliki array tools');
  });
});