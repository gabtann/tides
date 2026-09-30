// backend/src/utils/priority.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { selectTopSignal } from './priority.js';

describe('selectTopSignal', () => {
  test('selects HIGH over MEDIUM and LOW', () => {
    const signals = [
      { type: 'VOLUME_MOVEMENT', priority: 'MEDIUM' },
      { type: 'PRICE_MOVEMENT', priority: 'HIGH' },
      { type: 'HISTORICAL_DEVIATION', priority: 'LOW' },
    ];
    const top = selectTopSignal(signals);
    assert.equal(top.priority, 'HIGH');
  });

  test('returns MEDIUM when no HIGH present', () => {
    const signals = [
      { type: 'VOLUME_MOVEMENT', priority: 'MEDIUM' },
      { type: 'HISTORICAL_DEVIATION', priority: 'LOW' },
    ];
    const top = selectTopSignal(signals);
    assert.equal(top.priority, 'MEDIUM');
  });

  test('returns null for empty array', () => {
    assert.equal(selectTopSignal([]), null);
  });

  test('returns null for non‑array input', () => {
    assert.equal(selectTopSignal(null), null);
    assert.equal(selectTopSignal(undefined), null);
    assert.equal(selectTopSignal('not an array'), null);
  });
});
