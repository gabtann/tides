/**
 * Unit tests untuk integration/agent.client.js
 *
 * Menggunakan Node.js built-in test runner + mock global `fetch` —
 * tidak perlu dependency tambahan.
 *
 * Cakupan (Task 4 / Task 5 CP2):
 *   1. AGENT_NOT_CONFIGURED — AGENT_BASE_URL kosong
 *   2. AGENT_REQUEST_FAILED — Agent mengembalikan HTTP error (4xx/5xx)
 *   3. AGENT_TIMEOUT        — fetch melebihi 15 detik (AbortError)
 *   4. Happy path           — Agent merespons 200 OK dengan payload valid
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

// ── Simpan & pulihkan env ────────────────────────────────────────────────────
let originalAgentBaseUrl;

// ── Mock global fetch ────────────────────────────────────────────────────────
// Node.js >= 18 menyediakan global fetch; kita ganti sementara per-test.
let mockFetch = null;
const originalFetch = global.fetch;

before(() => {
  originalAgentBaseUrl = process.env.AGENT_BASE_URL;
});

after(() => {
  process.env.AGENT_BASE_URL = originalAgentBaseUrl ?? '';
  global.fetch = originalFetch;
});

// ── Importasi dinamis sehingga re-import mengambil env terbaru ───────────────
// Catatan: Node ESM cache import; kita tidak bisa mudah re-require setelah
// perubahan env. Oleh karena itu kita mock di level `config` object dan
// langsung patch `global.fetch` yang dipakai di dalam agent.client.js.

async function importRunAgent() {
  // Import sekali; agent.client.js membaca config.agentBaseUrl saat runtime,
  // bukan saat import, sehingga kita bisa mengontrol via patching config.
  const mod = await import('../integration/agent.client.js');
  return mod.runAgent;
}

async function importConfig() {
  const mod = await import('../config/env.js');
  return mod.config;
}

// ============================================================
// Skenario 1 — Agent Not Configured (AGENT_BASE_URL kosong)
// ============================================================

describe('agent.client — AGENT_NOT_CONFIGURED', () => {
  test('melempar error AGENT_NOT_CONFIGURED ketika agentBaseUrl tidak dikonfigurasi', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = ''; // paksa tidak terkonfigurasi

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_NOT_CONFIGURED');
          assert.ok(err.message.includes('not configured'));
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
    }
  });
});

// ============================================================
// Skenario 2 — Agent Request Failed (HTTP error dari Agent)
// ============================================================

describe('agent.client — AGENT_REQUEST_FAILED', () => {
  test('melempar AGENT_REQUEST_FAILED ketika Agent merespons HTTP 500', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_REQUEST_FAILED');
          assert.equal(err.status, 500);
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('melempar AGENT_REQUEST_FAILED ketika Agent merespons HTTP 503', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    global.fetch = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_REQUEST_FAILED');
          assert.equal(err.status, 503);
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });
});

// ============================================================
// Skenario 3 — Agent Timeout (AbortError)
// ============================================================

describe('agent.client — AGENT_TIMEOUT', () => {
  test('melempar AGENT_TIMEOUT ketika fetch di-abort dengan AbortError', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    // Simulasi AbortError (yang dilempar AbortController.abort())
    global.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_TIMEOUT');
          assert.ok(err.message.includes('timed out'));
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });
});

// ============================================================
// Skenario 4 — Happy Path (200 OK)
// ============================================================

describe('agent.client — happy path', () => {
  test('mengembalikan JSON body ketika Agent merespons 200 OK', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    const mockResponse = {
      ticker: 'BBCA',
      evidenceStrength: 'MODERATE',
      observed: ['BBCA rose 6.20% on 2026-09-28'],
      compared: [],
      interpreted: [],
      unknown: [],
      limitation: null,
    };

    global.fetch = async (url, opts) => {
      // Verifikasi URL & method yang dikirim agent client
      assert.ok(url.includes('/investigate'), 'URL harus mengandung /investigate');
      assert.equal(opts.method, 'POST');
      assert.equal(opts.headers['Content-Type'], 'application/json');

      return {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      };
    };

    try {
      const result = await runAgent({ ticker: 'BBCA' });
      assert.deepEqual(result, mockResponse);
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('mengirim body payload yang benar ke Agent service', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    const inputPayload = {
      ticker: 'BBCA',
      signal: { type: 'PRICE_MOVEMENT', details: { direction: 'UP', magnitude: 6.2 } },
      currentContext: { currentPrice: 8500, sector: 'Financials' },
    };

    let capturedBody = null;
    global.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ ticker: 'BBCA', evidenceStrength: 'STRONG' }),
      };
    };

    try {
      await runAgent(inputPayload);
      assert.equal(capturedBody.ticker, 'BBCA');
      assert.equal(capturedBody.signal.type, 'PRICE_MOVEMENT');
      assert.ok(capturedBody.currentContext);
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });
});
