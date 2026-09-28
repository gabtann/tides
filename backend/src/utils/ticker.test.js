/**
 * Unit tests untuk utils/ticker.js
 * Menggunakan Node.js built-in test runner (node:test) — tidak perlu dependency tambahan.
 * Jalankan: node --test src/utils/ticker.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTicker, toSectorsSymbol } from './ticker.js';

// ============================================================
// normalizeTicker
// ============================================================

describe('normalizeTicker', () => {
  // --- Input dengan suffix .JK ---

  test('strips .JK suffix (uppercase)', () => {
    assert.equal(normalizeTicker('BBCA.JK'), 'BBCA');
  });

  test('strips .JK suffix (lowercase input)', () => {
    assert.equal(normalizeTicker('bbca.jk'), 'BBCA');
  });

  test('strips .JK suffix (mixed case)', () => {
    assert.equal(normalizeTicker('Bbca.Jk'), 'BBCA');
  });

  test('strips .jk suffix (all lowercase)', () => {
    assert.equal(normalizeTicker('byan.jk'), 'BYAN');
  });

  // --- Input tanpa suffix .JK ---

  test('uppercases input without .JK suffix', () => {
    assert.equal(normalizeTicker('BBCA'), 'BBCA');
  });

  test('uppercases lowercase input without .JK suffix', () => {
    assert.equal(normalizeTicker('bbca'), 'BBCA');
  });

  test('uppercases mixed-case input without .JK suffix', () => {
    assert.equal(normalizeTicker('BbCa'), 'BBCA');
  });

  // --- Hasil tidak mengandung .JK ---

  test('result never contains .JK', () => {
    const result = normalizeTicker('CUAN.JK');
    assert.ok(!result.includes('.JK'), `Expected no .JK in result, got: ${result}`);
  });

  // --- Input tidak valid: null/undefined/non-string ---

  test('returns null for null input', () => {
    assert.equal(normalizeTicker(null), null);
  });

  test('returns null for undefined input', () => {
    assert.equal(normalizeTicker(undefined), null);
  });

  test('returns null for empty string', () => {
    assert.equal(normalizeTicker(''), null);
  });

  test('returns null for whitespace-only string', () => {
    assert.equal(normalizeTicker('   '), null);
  });

  test('returns null for number input', () => {
    assert.equal(normalizeTicker(12345), null);
  });

  test('returns null for object input', () => {
    assert.equal(normalizeTicker({}), null);
  });
});

// ============================================================
// toSectorsSymbol
// ============================================================

describe('toSectorsSymbol', () => {
  test('strips .JK and uppercases', () => {
    assert.equal(toSectorsSymbol('BBCA.JK'), 'BBCA');
  });

  test('handles lowercase with .jk suffix', () => {
    assert.equal(toSectorsSymbol('bbca.jk'), 'BBCA');
  });

  test('handles input without .JK', () => {
    assert.equal(toSectorsSymbol('BBCA'), 'BBCA');
  });

  test('returns null for null input', () => {
    assert.equal(toSectorsSymbol(null), null);
  });

  test('returns null for undefined input', () => {
    assert.equal(toSectorsSymbol(undefined), null);
  });

  test('returns null for empty string', () => {
    assert.equal(toSectorsSymbol(''), null);
  });

  // Hasil toSectorsSymbol harus konsisten dengan normalizeTicker
  // (keduanya pakai aturan yang sama saat ini)
  test('produces same result as normalizeTicker for valid input', () => {
    const inputs = ['BBCA.JK', 'bbca', 'BYAN.JK', 'cuan.jk'];
    for (const input of inputs) {
      assert.equal(
        toSectorsSymbol(input),
        normalizeTicker(input),
        `Mismatch for input: ${input}`
      );
    }
  });
});
