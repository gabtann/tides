import { getLastSignals } from '../services/scan.service.js';

export function listSignals(req, res, next) {
  try {
    res.json({ success: true, data: { signals: getLastSignals() } });
  } catch (err) {
    next(err);
  }
}