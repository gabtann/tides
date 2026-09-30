import { investigate } from '../services/agent.service.js';

export async function investigateTicker(req, res, next) {
  try {
    const payload = await investigate(req.body);
    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
}