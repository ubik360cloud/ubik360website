import { withOwner } from '../../_lib/auth.js';
import { stageApprove } from '../../_lib/weeklyPlan.js';

export default withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { exclude_ids = [] } = req.body || {};
  try {
    const result = await stageApprove(req.query.id, { excludeIds: exclude_ids, by: ownerEmail });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});
