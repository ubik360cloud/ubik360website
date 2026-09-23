// Weekly Apollo plan endpoints -- see ../_lib/weeklyPlan.js for the actual
// propose/pull/approve/stageApprove logic. Consolidated into named exports
// (rather than one file per route) because Vercel Hobby caps a deployment
// at 12 serverless functions -- see ../handler.js.
import { withOwner } from '../_lib/auth.js';
import { withCron } from '../_lib/cron.js';
import { supabase } from '../_lib/supabase.js';
import { proposeWeeklyPlan, proposeCustomPlan, approvePlan, stageApprove } from '../_lib/weeklyPlan.js';

export const current = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const track = req.query.track;
  if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });

  const db = supabase();
  const { data, error } = await db
    .from('apollo_weekly_plans')
    .select('*')
    .eq('track', track)
    .order('week_of', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ plan: data || null });
});

// Lists every plan for a track (standard weekly ones + custom-labeled ones),
// newest first -- unlike `current`, which only ever returns the single
// latest row and can't show custom test campaigns running alongside it.
export const list = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const track = req.query.track;
  if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });

  const db = supabase();
  const { data, error } = await db
    .from('apollo_weekly_plans')
    .select('*')
    .eq('track', track)
    .order('created_at', { ascending: false })
    .limit(25);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ plans: data || [] });
});

// Creates a one-off, manually-targeted plan (a specific geography/industry/
// angle Jose wants to test) alongside the standard automated weekly plan.
// Owner-authed like the rest of this file -- see ../_lib/auth.js for the
// GROWTH_ADMIN_SECRET escape hatch this also accepts, for triggering a test
// pull directly without going through the (not-yet-built) hub UI form.
export const custom = withOwner(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { track, label, brief, filter, target } = req.body || {};
  if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });
  if (!label) return res.status(400).json({ error: 'label is required' });
  if (!filter || typeof filter !== 'object') return res.status(400).json({ error: 'filter object is required' });
  try {
    const plan = await proposeCustomPlan({ track, label, brief, filter, target: target || 10 });
    return res.status(200).json({ plan });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export const propose = withCron(async (req, res) => {
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

export const approve = withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const plan = await approvePlan(req.params.id, { by: ownerEmail });
    return res.status(200).json({ plan });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export const staged = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  const [{ data: plan, error: planErr }, { data: stagedRows, error: stErr }] = await Promise.all([
    db.from('apollo_weekly_plans').select('*').eq('id', req.params.id).single(),
    db.from('apollo_staging').select('*').eq('weekly_plan_id', req.params.id).order('created_at', { ascending: true }),
  ]);
  if (planErr) return res.status(404).json({ error: 'plan not found' });
  if (stErr) return res.status(500).json({ error: stErr.message });
  return res.status(200).json({ plan, staged: stagedRows || [] });
});

export const stageApproveRoute = withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { exclude_ids = [] } = req.body || {};
  try {
    const result = await stageApprove(req.params.id, { excludeIds: exclude_ids, by: ownerEmail });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});
