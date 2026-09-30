import { Router } from 'express';
import {
  listWatchlist,
  createWatchlistEntry,
  deleteWatchlistEntry,
} from '../api/watchlist.controller.js';
import { requireFields } from '../middleware/validate.js';
import { triggerScan } from '../api/scan.controller.js';
import { listSignals } from '../api/signals.controller.js';
import { investigateTicker } from '../api/agent.controller.js';
import { requireApiKey } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';

const router = Router();

const scanLimiter = rateLimit({ max: 10, windowMs: 60 * 1000 });
const defaultLimiter = rateLimit({ max: 60, windowMs: 60 * 1000 });

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use(requireApiKey);

router.get('/watchlist', defaultLimiter, listWatchlist);
router.post('/watchlist', defaultLimiter, requireFields(['symbol']), createWatchlistEntry);
router.delete('/watchlist/:symbol', defaultLimiter, deleteWatchlistEntry);
router.post('/scan', scanLimiter, triggerScan);
router.post('/agent/investigate', defaultLimiter, investigateTicker);
router.get('/signals', defaultLimiter, listSignals);

export default router;
