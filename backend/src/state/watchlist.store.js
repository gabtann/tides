let watchlist = [];

export const watchlistStore = {
  getAll: () => watchlist,
  exists: (symbol) => watchlist.some((item) => item.symbol === symbol),
  add: (symbol) => {
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