import { runAgent } from '../integration/agent.client.js';
import { buildEvidenceBrief } from '../services/evidence.service.js';

export async function investigateSignal(req, res, next) {
  try {
    const result = await runAgent(req.body);
    const evidenceBrief = buildEvidenceBrief(result);

    res.json({
      success: true,
      data: evidenceBrief,
    });
  } catch (err) {
    next(err);
  }
}