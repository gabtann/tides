let watchlist = [];
const MAX_WATCHLIST_SIZE = 50;

export const watchlistStore = {
  getAll: () => watchlist,
  exists: (symbol) => watchlist.some((item) => item.symbol === symbol),
  add: (symbol) => {
    if (watchlist.length >= MAX_WATCHLIST_SIZE) {
      const err = new Error(`Watchlist limit reached (max ${MAX_WATCHLIST_SIZE} symbols)`);
      err.status = 400; // or 429
      err.code = 'LIMIT_REACHED';
      throw err;
    }
    const entry = { symbol, added_at: new Date().toISOString() };
    watchlist.push(entry);
    return entry;
  },
  remove: (symbol) => {
    const before = watchlist.length;
    watchlist = watchlist.filter((item) => item.symbol !== symbol);
    return watchlist.length < before;
  },
};