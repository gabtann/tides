import { Router } from 'express';
import { listWatchlist, createWatchlistEntry, deleteWatchlistEntry } from '../api/watchlist.controller.js';
import { requireFields } from '../middleware/validate.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.get('/watchlist', listWatchlist);
router.post('/watchlist', requireFields(['symbol']), createWatchlistEntry);
router.delete('/watchlist/:symbol', deleteWatchlistEntry);

export default router;