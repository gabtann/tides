import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addToWatchlist, getWatchlist, removeFromWatchlist } from './watchlist.service.js';

describe('watchlist.service', () => {
  beforeEach(() => {
    const list = [...getWatchlist()];
    for (const item of list) {
      try {
        removeFromWatchlist(item.symbol);
      } catch (e) {}
    }
  });

  test('addToWatchlist rejects non-string symbols like array', () => {
    assert.throws(() => addToWatchlist([]), { code: 'VALIDATION_ERROR' });
    assert.throws(() => addToWatchlist({}), { code: 'VALIDATION_ERROR' });
  });

  test('addToWatchlist rejects invalid path injection symbols like ../OTHER/?', () => {
    assert.throws(() => addToWatchlist('../OTHER/?'), { code: 'VALIDATION_ERROR' });
    assert.throws(() => addToWatchlist('A/B.JK'), { code: 'VALIDATION_ERROR' });
  });

  test('addToWatchlist enforces MAX_WATCHLIST_SIZE = 50', () => {
    for (let i = 0; i < 50; i++) {
      addToWatchlist(`TICK${i}`);
    }
    assert.equal(getWatchlist().length, 50);
    assert.throws(() => addToWatchlist('EXTRA'), { code: 'LIMIT_REACHED' });
  });
});
