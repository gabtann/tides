import { Router } from 'express';
import { listWatchlist, createWatchlistEntry, deleteWatchlistEntry } from '../api/watchlist.controller.js';
import { requireFields } from '../middleware/validate.js';
import { triggerScan } from '../api/scan.controller.js';
import { listSignals } from '../api/signals.controller.js';
const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.get('/watchlist', listWatchlist);
router.post('/watchlist', requireFields(['symbol']), createWatchlistEntry);
router.delete('/watchlist/:symbol', deleteWatchlistEntry);
router.post('/scan', triggerScan);
router.get('/signals', listSignals);


export default router;