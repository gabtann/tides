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

  // ── removeFromWatchlist — edge cases normalisasi ticker ─────────────────────

  test('removeFromWatchlist berhasil hapus simbol dengan suffix .JK uppercase', () => {
    addToWatchlist('BBCA');
    // DELETE /watchlist/BBCA.JK seharusnya menghapus BBCA (bug D.5)
    const removed = removeFromWatchlist('BBCA.JK');
    assert.equal(removed, 'BBCA');
    assert.equal(getWatchlist().find((i) => i.symbol === 'BBCA'), undefined);
  });

  test('removeFromWatchlist berhasil hapus simbol dengan suffix .jk lowercase', () => {
    addToWatchlist('BBRI');
    const removed = removeFromWatchlist('bbri.jk');
    assert.equal(removed, 'BBRI');
    assert.equal(getWatchlist().find((i) => i.symbol === 'BBRI'), undefined);
  });

  test('removeFromWatchlist berhasil hapus simbol lowercase tanpa suffix', () => {
    addToWatchlist('TLKM');
    const removed = removeFromWatchlist('tlkm');
    assert.equal(removed, 'TLKM');
    assert.equal(getWatchlist().find((i) => i.symbol === 'TLKM'), undefined);
  });

  test('removeFromWatchlist lempar NOT_FOUND untuk simbol yang tidak ada di store', () => {
    // Pastikan store kosong dari simbol ini
    assert.throws(() => removeFromWatchlist('ZZZZZ'), { code: 'NOT_FOUND' });
  });

  test('removeFromWatchlist lempar VALIDATION_ERROR untuk input non-string', () => {
    assert.throws(() => removeFromWatchlist(null), { code: 'VALIDATION_ERROR' });
    assert.throws(() => removeFromWatchlist(undefined), { code: 'VALIDATION_ERROR' });
  });
});
