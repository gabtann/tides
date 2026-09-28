import { watchlistStore } from '../state/watchlist.store.js';

export function getWatchlist() {
  return watchlistStore.getAll();
}

import { normalizeTicker } from '../utils/ticker.js';

export function addToWatchlist(symbol) {
  if (typeof symbol !== 'string' || !/^[A-Za-z0-9]{1,10}(\.[JKjk]{2})?$/.test(symbol)) {
    const err = new Error(`Invalid symbol format`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const clean = normalizeTicker(symbol);
  if (!clean) {
    const err = new Error(`Invalid symbol format`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (watchlistStore.exists(clean)) {
    const err = new Error(`Symbol '${clean}' already in watchlist`);
    err.status = 400;
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }
  return watchlistStore.add(clean);
}

export function removeFromWatchlist(symbol) {
  const removed = watchlistStore.remove(symbol.toUpperCase());
  if (!removed) {
    const err = new Error(`Symbol '${symbol}' not found`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return symbol.toUpperCase();
}