/**
 * Unit tests untuk services/sectors-normalizer.service.js
 * Menggunakan Node.js built-in test runner (node:test) — tidak perlu dependency tambahan.
 * Jalankan: node --test src/services/sectors-normalizer.service.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOverview,
  normalizeDailyHistory,
  normalizePeers,
} from './sectors-normalizer.service.js';

// ============================================================
// Fixture helpers
// ============================================================

function makeRawOverview(overrides = {}) {
  return {
    symbol: 'BBCA.JK',
    company_name: 'PT Bank Central Asia Tbk.',
    overview: {
      last_close_price: 6300,
      latest_close_date: '2026-09-23',
      daily_close_change: 0.0048,
      market_cap: 770112000000000,
      sector: 'Financials',
      sub_sector: 'Banking',
      industry: 'Banks',
      sub_industry: 'Banks',
      all_time_price: {
        '90_d_high': { '2026-07-01': 6700 },
        '90_d_low':  { '2026-08-19': 5900 },
      },
    },
    ...overrides,
  };
}

function makeRawDailyHistory() {
  return [
    {
      symbol: 'BBCA.JK',
      date: '2026-09-22',
      open: 6250,
      high: 6350,
      low: 6200,
      close: 6300,
      volume: 12000000,
      market_cap: 770112000000000,
    },
    {
      symbol: 'BBCA.JK',
      date: '2026-09-23',
      open: 6300,
      high: 6400,
      low: 6280,
      close: 6350,
      volume: 9500000,
      market_cap: 776224000000000,
    },
  ];
}

function makeRawPeers(includesSelf = false) {
  const companies = [
    { symbol: 'BBRI.JK', market_cap: 500000000000, pb_mrq: 1.5, pe_ttm: 10.2, yearly_mcap_chg: 0.05 },
    { symbol: 'BMRI.JK', market_cap: 450000000000, pb_mrq: 1.3, pe_ttm: 9.8,  yearly_mcap_chg: -0.02 },
  ];

  if (includesSelf) {
    companies.push({ symbol: 'BBCA.JK', market_cap: 770112000000000, pb_mrq: 3.1, pe_ttm: 22, yearly_mcap_chg: 0.1 });
  }

  return {
    peers: [
      {
        peers_data: {
          companies,
        },
      },
    ],
  };
}

// ============================================================
// normalizeOverview
// ============================================================

describe('normalizeOverview', () => {
  test('extracts fields from nested overview object correctly', () => {
    const result = normalizeOverview(makeRawOverview());

    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.company_name, 'PT Bank Central Asia Tbk.');
    assert.equal(result.price, 6300);
    assert.equal(result.price_date, '2026-09-23');
    assert.equal(result.daily_price_change, 0.0048);
    assert.equal(result.market_cap, 770112000000000);
    assert.equal(result.sector, 'Financials');
    assert.equal(result.sub_sector, 'Banking');
    assert.equal(result.industry, 'Banks');
    assert.equal(result.sub_industry, 'Banks');
    assert.equal(result.ninety_day_high, 6700);
    assert.equal(result.ninety_day_low, 5900);
  });

  test('ticker does not contain .JK (raw symbol has .JK)', () => {
    const result = normalizeOverview(makeRawOverview({ symbol: 'BYAN.JK' }));
    assert.ok(!result.ticker.includes('.JK'), `ticker should not contain .JK, got: ${result.ticker}`);
    assert.equal(result.ticker, 'BYAN');
  });

  test('ticker is uppercase even if raw symbol is lowercase', () => {
    const result = normalizeOverview(makeRawOverview({ symbol: 'bbca.jk' }));
    assert.equal(result.ticker, 'BBCA');
  });

  test('returns null for ticker when symbol is missing', () => {
    const result = normalizeOverview({ overview: {} });
    assert.equal(result.ticker, null);
  });

  test('returns null for fields when raw is null', () => {
    const result = normalizeOverview(null);
    assert.equal(result.ticker, null);
    assert.equal(result.company_name, null);
    assert.equal(result.price, null);
    assert.equal(result.sector, null);
    assert.equal(result.sub_industry, null);
  });

  test('does not crash when overview object is missing', () => {
    const result = normalizeOverview({ symbol: 'BBCA.JK', company_name: 'X' });
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.price, null);
    assert.equal(result.ninety_day_high, null);
  });

  test('does not crash when all_time_price is missing', () => {
    const raw = makeRawOverview();
    delete raw.overview.all_time_price;
    const result = normalizeOverview(raw);
    assert.equal(result.ninety_day_high, null);
    assert.equal(result.ninety_day_low, null);
  });

  test('sub_industry field is present and extracted correctly', () => {
    const result = normalizeOverview(makeRawOverview());
    assert.ok('sub_industry' in result, 'sub_industry field should exist');
    assert.equal(result.sub_industry, 'Banks');
  });

  test('sub_industry is null when missing from raw', () => {
    const raw = makeRawOverview();
    delete raw.overview.sub_industry;
    const result = normalizeOverview(raw);
    assert.equal(result.sub_industry, null);
  });
});

// ============================================================
// normalizeDailyHistory
// ============================================================

describe('normalizeDailyHistory', () => {
  test('maps array of daily records correctly', () => {
    const result = normalizeDailyHistory(makeRawDailyHistory());
    assert.equal(result.length, 2);
    assert.equal(result[0].ticker, 'BBCA');
    assert.equal(result[0].date, '2026-09-22');
    assert.equal(result[0].open, 6250);
    assert.equal(result[0].close, 6300);
    assert.equal(result[0].volume, 12000000);
  });

  test('ticker does not contain .JK', () => {
    const result = normalizeDailyHistory(makeRawDailyHistory());
    for (const item of result) {
      assert.ok(!item.ticker.includes('.JK'), `ticker should not contain .JK, got: ${item.ticker}`);
    }
  });

  test('returns empty array when input is not an array', () => {
    assert.deepEqual(normalizeDailyHistory(null), []);
    assert.deepEqual(normalizeDailyHistory(undefined), []);
    assert.deepEqual(normalizeDailyHistory({}), []);
    assert.deepEqual(normalizeDailyHistory('string'), []);
    assert.deepEqual(normalizeDailyHistory(42), []);
  });

  test('returns empty array when input is empty array', () => {
    assert.deepEqual(normalizeDailyHistory([]), []);
  });

  test('does not crash and returns null fields when record fields are missing', () => {
    const result = normalizeDailyHistory([{}]);
    assert.equal(result.length, 1);
    assert.equal(result[0].ticker, null);
    assert.equal(result[0].date, null);
    assert.equal(result[0].close, null);
  });

  test('handles null records inside the array', () => {
    const result = normalizeDailyHistory([null]);

    assert.deepEqual(result, [
      {
        ticker: null,
        date: null,
        open: null,
        high: null,
        low: null,
        close: null,
        volume: null,
        market_cap: null,
      },
    ]);
  });

  test('preserves the input order of historical records', () => {
    const raw = [
      {
        symbol: 'BBCA.JK',
        date: '2026-09-23',
        close: 6350,
      },
      {
        symbol: 'BBCA.JK',
        date: '2026-09-22',
        close: 6300,
      },
    ];

    const result = normalizeDailyHistory(raw);

    assert.deepEqual(
      result.map((item) => item.date),
      ['2026-09-23', '2026-09-22']
    );
  });
});

// ============================================================
// normalizePeers
// ============================================================

describe('normalizePeers', () => {
  test('maps peer companies correctly', () => {
    const result = normalizePeers(makeRawPeers(), 'BBCA');
    assert.equal(result.length, 2);
    assert.equal(result[0].ticker, 'BBRI');
    assert.equal(result[0].pb, 1.5);
    assert.equal(result[0].pe, 10.2);
    assert.equal(result[1].ticker, 'BMRI');
  });

  test('filters self-peer when queryTicker matches (without .JK)', () => {
    const raw = makeRawPeers(true); // includesSelf = true
    const result = normalizePeers(raw, 'BBCA');
    const tickers = result.map((p) => p.ticker);
    assert.ok(!tickers.includes('BBCA'), 'BBCA (self) should be filtered out');
    assert.equal(result.length, 2);
  });

  test('filters self-peer when queryTicker has .JK suffix', () => {
    const raw = makeRawPeers(true);
    const result = normalizePeers(raw, 'BBCA.JK'); // caller passes with .JK
    const tickers = result.map((p) => p.ticker);
    assert.equal(result.length, 2);
    assert.ok(!tickers.includes('BBCA'), 'BBCA (self) should be filtered out even when queryTicker has .JK');
  });

  test('peer tickers do not contain .JK', () => {
    const result = normalizePeers(makeRawPeers(), 'BBCA');
    for (const p of result) {
      assert.ok(!p.ticker.includes('.JK'), `peer ticker should not contain .JK, got: ${p.ticker}`);
    }
  });

  test('returns empty array when peers data is missing', () => {
    assert.deepEqual(normalizePeers({}, 'BBCA'), []);
    assert.deepEqual(normalizePeers(null, 'BBCA'), []);
    assert.deepEqual(normalizePeers({ peers: [] }, 'BBCA'), []);
  });

  test('does not crash when queryTicker is null or undefined', () => {
    // self-filter jadi no-op kalau queryTicker null, tapi tidak boleh crash
    const result = normalizePeers(makeRawPeers(), null);
    assert.equal(result.length, 2);
  });

  test('missing fields in peer record result in null, not crash', () => {
    const raw = { peers: [{ peers_data: { companies: [{}] } }] };
    const result = normalizePeers(raw, 'BBCA');
    assert.equal(result.length, 1); // {} ticker = null, bukan BBCA, tidak difilter
    assert.equal(result[0].ticker, null);
    assert.equal(result[0].pb, null);
    assert.equal(result[0].pe, null);
  });

  test('returns empty array when companies is not an array', () => {
    const raw = {
      peers: [
        {
          peers_data: {
            companies: {},
          },
        },
      ],
    };

    assert.deepEqual(normalizePeers(raw, 'BBCA'), []);
  });
});
