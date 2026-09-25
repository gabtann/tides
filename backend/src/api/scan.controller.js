import { runScan } from '../services/scan.service.js';

export async function triggerScan(req, res, next) {
  try {
    const result = await runScan();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}