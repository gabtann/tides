// backend/src/utils/format.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toPercent } from './format.js';

describe('toPercent', () => {
  test('converts decimal to percent with two decimals', () => {
    assert.equal(toPercent(0.062), 6.2);
    assert.equal(toPercent(0.12345), 12.35);
  });

  test('returns null for non-number inputs', () => {
    assert.equal(toPercent(null), null);
    assert.equal(toPercent(undefined), null);
    assert.equal(toPercent('0.1'), null);
    assert.equal(toPercent(NaN), null);
  });
});
