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
          assert.equal(err.status, 502);
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
          assert.equal(err.status, 502);
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('mempertahankan structured AGENT_INVALID_JSON dari Agent', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 'AGENT_INVALID_JSON', message: 'Invalid JSON output' },
      }),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_INVALID_JSON');
          assert.equal(err.status, 500);
          assert.equal(err.message, 'Invalid JSON output');
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('mempertahankan structured AGENT_INVALID_OUTPUT dari Agent', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 'AGENT_INVALID_OUTPUT', message: 'Invalid output shape' },
      }),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_INVALID_OUTPUT');
          assert.equal(err.status, 500);
          assert.equal(err.message, 'Invalid output shape');
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('mempertahankan structured Sectors NOT_FOUND dari Agent', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Symbol not found on Sectors' },
      }),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'NOT_FOUND');
          assert.equal(err.status, 404);
          assert.equal(err.message, 'Symbol not found on Sectors');
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('mempertahankan error dalam format datar dari Agent saat ini', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'AGENT_INVESTIGATION_FAILED',
        message: 'Provider request failed',
      }),
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_INVESTIGATION_FAILED');
          assert.equal(err.status, 500);
          assert.equal(err.message, 'Provider request failed');
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('falls back to AGENT_REQUEST_FAILED for malformed or empty error bodies', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    try {
      for (const json of [
        async () => {
          throw new SyntaxError('Invalid JSON');
        },
        async () => null,
        async () => ({ success: false, error: { code: 'UNKNOWN_CODE' } }),
        async () => ({
          success: false,
          error: { code: 'UNKNOWN_CODE', message: 'Unsafe status' },
        }),
      ]) {
        global.fetch = async () => ({
          ok: false,
          status: 418,
          json,
        });

        await assert.rejects(
          () => runAgent({ ticker: 'BBCA' }),
          (err) => {
            assert.equal(err.code, 'AGENT_REQUEST_FAILED');
            assert.equal(err.status, 502);
            return true;
          }
        );
      }
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

  test('maps Agent network transport failures to AGENT_REQUEST_FAILED 502', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => {
      throw new TypeError('fetch failed');
    };

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_REQUEST_FAILED');
          assert.equal(err.status, 502);
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
  test('melempar AGENT_TIMEOUT 504 setelah 45 detik dan membersihkan timer', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();

    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';

    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    let timeoutCallback;
    let timeoutDelay;
    let clearedTimer;
    const timer = {};
    global.setTimeout = (callback, delay) => {
      timeoutCallback = callback;
      timeoutDelay = delay;
      return timer;
    };
    global.clearTimeout = (handle) => {
      clearedTimer = handle;
    };
    global.fetch = async (_url, options) => {
      timeoutCallback();
      assert.equal(options.signal.aborted, true);
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_TIMEOUT');
          assert.equal(err.status, 504);
          assert.ok(err.message.includes('timed out'));
          return true;
        }
      );
      assert.equal(timeoutDelay, 45_000);
      assert.equal(clearedTimer, timer);
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
    }
  });
});

// ============================================================
// Skenario 4 — Happy Path (200 OK)
// ============================================================

describe('agent.client — happy path', () => {
  test('throws AGENT_INVALID_RESPONSE 502 when a 200 response contains invalid JSON', async () => {
    const config = await importConfig();
    const runAgent = await importRunAgent();
    const saved = config.agentBaseUrl;
    config.agentBaseUrl = 'http://mock-agent:9999';
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    try {
      await assert.rejects(
        () => runAgent({ ticker: 'BBCA' }),
        (err) => {
          assert.equal(err.code, 'AGENT_INVALID_RESPONSE');
          assert.equal(err.status, 502);
          assert.match(err.message, /invalid JSON/i);
          return true;
        }
      );
    } finally {
      config.agentBaseUrl = saved;
      global.fetch = originalFetch;
    }
  });

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
