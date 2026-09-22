// Spends real Apollo credits (bulk_match) -- deliberately requires an
// explicit owner-authenticated click from the hub, never auto-runs.
import { withOwner } from '../../_lib/auth.js';
import { approvePlan } from '../../_lib/weeklyPlan.js';

export default withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const plan = await approvePlan(req.query.id, { by: ownerEmail });
    return res.status(200).json({ plan });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});
