// Cron-triggered daily -- sends whatever flow steps are due, up to the
// shared daily cap. See flowEngine.js for the cap-and-stop behavior.
import { withCron } from '../_lib/cron.js';
import { runDueSteps } from '../_lib/flowEngine.js';

export default withCron(async (req, res) => {
  try {
    const result = await runDueSteps();
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error('[flows/run] failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
});
