// Cron-triggered (see root vercel.json) -- Fridays. Proposes this week's
// Apollo plan for BOTH tracks; each is independent and idempotent per
// (track, week), so a retry or a manual re-trigger is harmless.
import { withCron } from '../_lib/cron.js';
import { proposeWeeklyPlan } from '../_lib/weeklyPlan.js';

export default withCron(async (req, res) => {
  const results = {};
  for (const track of ['ic', 'b2b']) {
    try {
      results[track] = await proposeWeeklyPlan(track);
    } catch (e) {
      console.error(`[weekly-plan/propose] ${track} failed:`, e.message);
      results[track] = { error: e.message };
    }
  }
  return res.status(200).json({ ok: true, results });
});
