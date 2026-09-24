import { watchlistStore } from '../state/watchlist.store.js';

export function getWatchlist() {
  return watchlistStore.getAll();
}

export function addToWatchlist(symbol) {
  const clean = symbol.trim().toUpperCase();
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