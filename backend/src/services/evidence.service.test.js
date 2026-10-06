/**
 * Unit tests untuk services/evidence.service.js
 * Menggunakan Node.js built-in test runner (node:test) â€” tidak perlu dependency tambahan.
 * Jalankan: node --test src/services/evidence.service.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidenceBrief } from './evidence.service.js';

// ============================================================
// Fixture helper
// ============================================================

function makeAgentResult(overrides = {}) {
  return {
    ticker: 'BBCA',
    signal: 'Price moved 6.20% in one day',
    observed: ['BBCA rose 6.20% on 2026-09-28'],
    compared: ['Sector peers rose 1.1% on average'],
    interpreted: ['Movement appears specific to BBCA'],
    unknown: ['Cause of volume spike not confirmed'],
    evidenceStrength: 'MODERATE',
    researchPriority: 'MEDIUM',
    generatedAt: '2026-09-28T10:00:00.000Z',
    limitation: null,
    ...overrides,
  };
}

// ============================================================
// evidenceStrength normalization
// ============================================================

describe('buildEvidenceBrief â€” evidenceStrength', () => {
  test('passes through STRONG unchanged', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'STRONG' }));
    assert.equal(result.evidenceStrength, 'STRONG');
  });

  test('passes through MODERATE unchanged', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'MODERATE' }));
    assert.equal(result.evidenceStrength, 'MODERATE');
  });

  test('passes through WEAK unchanged', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'WEAK' }));
    assert.equal(result.evidenceStrength, 'WEAK');
  });

  test('uppercases mixed-case "Weak" to "WEAK"', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'Weak' }));
    assert.equal(result.evidenceStrength, 'WEAK');
  });

  test('uppercases mixed-case "Moderate" to "MODERATE"', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'Moderate' }));
    assert.equal(result.evidenceStrength, 'MODERATE');
  });

  test('uppercases mixed-case "Strong" to "STRONG"', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'Strong' }));
    assert.equal(result.evidenceStrength, 'STRONG');
  });

  test('falls back to WEAK when evidenceStrength is missing', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: undefined }));
    assert.equal(result.evidenceStrength, 'WEAK');
  });

  test('falls back to WEAK when evidenceStrength is unrecognized value', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'UNKNOWN_VALUE' }));
    assert.equal(result.evidenceStrength, 'WEAK');
  });

  test('falls back to WEAK when evidenceStrength is not a string', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 42 }));
    assert.equal(result.evidenceStrength, 'WEAK');
  });
});

// ============================================================
// researchPriority
// ============================================================

describe('buildEvidenceBrief â€” researchPriority', () => {
  test('field researchPriority ada di output', () => {
    const result = buildEvidenceBrief(makeAgentResult());
    assert.ok('researchPriority' in result, 'researchPriority should exist in output');
  });

  test('passes through HIGH, MEDIUM, LOW unchanged', () => {
    assert.equal(buildEvidenceBrief(makeAgentResult({ researchPriority: 'HIGH' })).researchPriority, 'HIGH');
    assert.equal(buildEvidenceBrief(makeAgentResult({ researchPriority: 'MEDIUM' })).researchPriority, 'MEDIUM');
    assert.equal(buildEvidenceBrief(makeAgentResult({ researchPriority: 'LOW' })).researchPriority, 'LOW');
  });

  test('uppercases mixed-case researchPriority', () => {
    const result = buildEvidenceBrief(makeAgentResult({ researchPriority: 'High' }));
    assert.equal(result.researchPriority, 'HIGH');
  });

  test('STRONG evidenceStrength â†’ HIGH priority when researchPriority missing', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'STRONG', researchPriority: undefined }));
    assert.equal(result.researchPriority, 'HIGH');
  });

  test('MODERATE evidenceStrength â†’ MEDIUM priority when researchPriority missing', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'MODERATE', researchPriority: undefined }));
    assert.equal(result.researchPriority, 'MEDIUM');
  });

  test('WEAK evidenceStrength â†’ LOW priority when researchPriority missing', () => {
    const result = buildEvidenceBrief(makeAgentResult({ evidenceStrength: 'WEAK', researchPriority: undefined }));
    assert.equal(result.researchPriority, 'LOW');
  });
});

// ============================================================
// generatedAt
// ============================================================

describe('buildEvidenceBrief â€” generatedAt', () => {
  test('field generatedAt ada di output', () => {
    const result = buildEvidenceBrief(makeAgentResult());
    assert.ok('generatedAt' in result, 'generatedAt should exist in output');
  });

  test('preserves generatedAt dari agent jika ada', () => {
    const ts = '2026-09-28T10:00:00.000Z';
    const result = buildEvidenceBrief(makeAgentResult({ generatedAt: ts }));
    assert.equal(result.generatedAt, ts);
  });

  test('menggunakan timestamp baru jika generatedAt tidak ada di input', () => {
    const before = Date.now();
    const result = buildEvidenceBrief(makeAgentResult({ generatedAt: undefined }));
    const after = Date.now();
    assert.ok(typeof result.generatedAt === 'string', 'generatedAt should be a string');
    const ts = new Date(result.generatedAt).getTime();
    assert.ok(ts >= before && ts <= after, 'generatedAt should be a recent timestamp');
  });
});

// ============================================================
// Array fields: observed, compared, interpreted, unknown
// ============================================================

describe('buildEvidenceBrief â€” array fields', () => {
  test('observed, compared, interpreted, unknown tetap array dari input array', () => {
    const result = buildEvidenceBrief(makeAgentResult());
    assert.ok(Array.isArray(result.observed), 'observed should be array');
    assert.ok(Array.isArray(result.compared), 'compared should be array');
    assert.ok(Array.isArray(result.interpreted), 'interpreted should be array');
    assert.ok(Array.isArray(result.unknown), 'unknown should be array');
  });

  test('string tunggal dibungkus jadi array satu elemen', () => {
    const result = buildEvidenceBrief(makeAgentResult({ observed: 'single observation' }));
    assert.deepEqual(result.observed, ['single observation']);
  });

  test('array kosong tetap array kosong', () => {
    const result = buildEvidenceBrief(makeAgentResult({ observed: [] }));
    assert.deepEqual(result.observed, []);
  });

  test('undefined field menghasilkan array kosong', () => {
    const result = buildEvidenceBrief(makeAgentResult({ observed: undefined, compared: undefined }));
    assert.deepEqual(result.observed, []);
    assert.deepEqual(result.compared, []);
  });
});

// ============================================================
// Null-safety / input tidak valid
// ============================================================

describe('buildEvidenceBrief â€” null-safety', () => {
  test('throws untuk input null', () => {
    assert.throws(() => buildEvidenceBrief(null), /Invalid agent result/);
  });

  test('throws untuk input string', () => {
    assert.throws(() => buildEvidenceBrief('not an object'), /Invalid agent result/);
  });

  test('throws untuk input number', () => {
    assert.throws(() => buildEvidenceBrief(42), /Invalid agent result/);
  });

  test('tidak crash untuk objek kosong â€” menggunakan semua fallback', () => {
    const result = buildEvidenceBrief({});
    assert.equal(result.ticker, null);
    assert.equal(result.signal, null);
    assert.deepEqual(result.observed, []);
    assert.deepEqual(result.compared, []);
    assert.deepEqual(result.interpreted, []);
    assert.deepEqual(result.unknown, []);
    assert.equal(result.evidenceStrength, 'WEAK');
    assert.equal(result.researchPriority, 'LOW');
    assert.ok(typeof result.generatedAt === 'string');
    assert.equal(result.limitation, null);
  });

  test('mengisi limitation dari input jika ada', () => {
    const result = buildEvidenceBrief(makeAgentResult({ limitation: 'Peer data not available' }));
    assert.equal(result.limitation, 'Peer data not available');
  });

  test('limitation null jika tidak dikirim agent', () => {
    const result = buildEvidenceBrief(makeAgentResult({ limitation: null }));
    assert.equal(result.limitation, null);
  });
});

// ============================================================
// Integritas output â€” semua field wajib ada
// ============================================================

describe('buildEvidenceBrief â€” output field completeness', () => {
  test('semua field kontrak EvidenceBrief ada di output', () => {
    const result = buildEvidenceBrief(makeAgentResult());
    const requiredFields = [
      'ticker', 'signal', 'observed', 'compared', 'interpreted',
      'unknown', 'evidenceStrength', 'researchPriority', 'generatedAt', 'limitation',
    ];
    for (const field of requiredFields) {
      assert.ok(field in result, `Field '${field}' should exist in EvidenceBrief output`);
    }
  });
});

// ============================================================
// CP4 Challenge Signal â€” pass-through
// ============================================================

describe('buildEvidenceBrief â€” CP4 Challenge Signal pass-through', () => {
  const challengeFields = {
    signalType: 'PRICE_MOVEMENT',
    challenge: {
      supporting: ['Volume confirms movement'],
      contradicting: ['Sector moved similarly'],
      alternativeExplanations: ['Market-wide rally'],
      unknown: ['Corporate action unconfirmed'],
    },
    challengeStatus: 'SUPPORTED',
    confidence: 'MODERATE',
  };

  test('passes through all Challenge fields when present in agent result', () => {
    const result = buildEvidenceBrief(makeAgentResult(challengeFields));

    assert.equal(result.signalType, 'PRICE_MOVEMENT');
    assert.deepEqual(result.challenge, challengeFields.challenge);
    assert.equal(result.challengeStatus, 'SUPPORTED');
    assert.equal(result.confidence, 'MODERATE');
  });

  test('Challenge fields are absent (not null) when agent omits them', () => {
    const result = buildEvidenceBrief(makeAgentResult());

    assert.equal('signalType' in result, false);
    assert.equal('challenge' in result, false);
    assert.equal('challengeStatus' in result, false);
    assert.equal('confidence' in result, false);
  });

  test('CP3 fields remain untouched when Challenge fields are present', () => {
    const result = buildEvidenceBrief(makeAgentResult(challengeFields));

    // All CP3 fields must be exactly the same as without Challenge
    assert.equal(result.ticker, 'BBCA');
    assert.equal(result.signal, 'Price moved 6.20% in one day');
    assert.deepEqual(result.observed, ['BBCA rose 6.20% on 2026-09-28']);
    assert.deepEqual(result.compared, ['Sector peers rose 1.1% on average']);
    assert.deepEqual(result.interpreted, ['Movement appears specific to BBCA']);
    assert.deepEqual(result.unknown, ['Cause of volume spike not confirmed']);
    assert.equal(result.evidenceStrength, 'MODERATE');
    assert.equal(result.researchPriority, 'MEDIUM');
    assert.equal(result.generatedAt, '2026-09-28T10:00:00.000Z');
    assert.equal(result.limitation, null);
  });

  test('challenge.limitation is separate from Evidence Brief limitation', () => {
    const result = buildEvidenceBrief(makeAgentResult({
      limitation: 'Evidence Brief level limitation',
      ...challengeFields,
      challenge: {
        ...challengeFields.challenge,
        limitation: 'Challenge level limitation',
      },
    }));

    // Evidence Brief limitation = top-level
    assert.equal(result.limitation, 'Evidence Brief level limitation');
    // Challenge limitation = inside challenge object, passed through as-is
    assert.equal(result.challenge.limitation, 'Challenge level limitation');
  });

  test('all challengeStatus enum values pass through', () => {
    for (const status of ['SUPPORTED', 'WEAKENED', 'CONTRADICTED', 'INCONCLUSIVE']) {
      const result = buildEvidenceBrief(makeAgentResult({ ...challengeFields, challengeStatus: status }));
      assert.equal(result.challengeStatus, status);
    }
  });

  test('all confidence enum values pass through', () => {
    for (const conf of ['STRONG', 'MODERATE', 'WEAK']) {
      const result = buildEvidenceBrief(makeAgentResult({ ...challengeFields, confidence: conf }));
      assert.equal(result.confidence, conf);
    }
  });
});
