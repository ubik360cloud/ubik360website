// Cron-triggered daily -- researches fresh leads for both tracks. Spends
// Anthropic API tokens, not Apollo credits (leads already exist in `leads`
// from a prior, human-approved weekly-plan import).
import { withCron } from '../_lib/cron.js';
import { dailyOneoffPull } from '../_lib/oneoffQueue.js';

export default withCron(async (req, res) => {
  const results = {};
  for (const track of ['ic', 'b2b']) {
    try {
      results[track] = await dailyOneoffPull(track);
    } catch (e) {
      console.error(`[oneoffs/pull] ${track} failed:`, e.message);
      results[track] = { error: e.message };
    }
  }
  return res.status(200).json({ ok: true, results });
});
