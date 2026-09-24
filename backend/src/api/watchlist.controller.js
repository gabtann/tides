import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlist.service.js';

export function listWatchlist(req, res, next) {
  try {
    res.json({ success: true, data: { watchlist: getWatchlist() } });
  } catch (err) {
    next(err);
  }
}

export function createWatchlistEntry(req, res, next) {
  try {
    const entry = addToWatchlist(req.body.symbol);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
}

export function deleteWatchlistEntry(req, res, next) {
  try {
    const removed = removeFromWatchlist(req.params.symbol);
    res.json({ success: true, data: { removed } });
  } catch (err) {
    next(err);
  }
}