// Replaces all steps for a flow -- same "replace, don't patch individual
// steps" pattern as the reference, simplest way to reorder/renumber safely.
import { withOwner } from '../../_lib/auth.js';
import { supabase } from '../../_lib/supabase.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const { steps } = req.body || {};
  if (!Array.isArray(steps) || !steps.length) return res.status(400).json({ error: 'steps array is required' });

  const db = supabase();
  await db.from('flow_steps').delete().eq('flow_id', req.query.id);
  const rows = steps.map((s, i) => ({
    flow_id: req.query.id,
    step_no: s.step_no ?? i + 1,
    delay_hours: s.delay_hours ?? 0,
    subject: s.subject,
    body: s.body,
    cta_url: s.cta_url || null,
    is_active: s.is_active !== false,
  }));
  const { data, error } = await db.from('flow_steps').insert(rows).select();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ steps: data });
});
