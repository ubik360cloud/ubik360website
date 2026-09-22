import { withOwner } from '../../_lib/auth.js';
import { supabase } from '../../_lib/supabase.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  const [{ data: plan, error: planErr }, { data: staged, error: stErr }] = await Promise.all([
    db.from('apollo_weekly_plans').select('*').eq('id', req.query.id).single(),
    db.from('apollo_staging').select('*').eq('weekly_plan_id', req.query.id).order('created_at', { ascending: true }),
  ]);
  if (planErr) return res.status(404).json({ error: 'plan not found' });
  if (stErr) return res.status(500).json({ error: stErr.message });
  return res.status(200).json({ plan, staged: staged || [] });
});
