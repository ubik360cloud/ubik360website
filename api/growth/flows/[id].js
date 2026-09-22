import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res, ownerEmail) => {
  const db = supabase();
  if (req.method === 'GET') {
    const [{ data: flow, error }, { data: steps }, { data: enrollments }] = await Promise.all([
      db.from('flows').select('*').eq('id', req.query.id).single(),
      db.from('flow_steps').select('*').eq('flow_id', req.query.id).order('step_no'),
      db.from('enrollments').select('status').eq('flow_id', req.query.id),
    ]);
    if (error) return res.status(404).json({ error: 'flow not found' });
    const enrollmentCounts = {};
    for (const e of enrollments || []) enrollmentCounts[e.status] = (enrollmentCounts[e.status] || 0) + 1;
    return res.status(200).json({ flow, steps: steps || [], enrollmentCounts });
  }

  if (req.method === 'PATCH') {
    const { name, description, status, send_window, per_contact_min_gap_hours } = req.body || {};
    if (status && !['draft', 'active', 'paused'].includes(status)) return res.status(400).json({ error: 'invalid status' });

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (send_window !== undefined) patch.send_window = send_window;
    if (per_contact_min_gap_hours !== undefined) patch.per_contact_min_gap_hours = per_contact_min_gap_hours;
    if (status === 'active') {
      // QA gate: every active step needs a subject + body before a flow can go live.
      const { data: steps } = await db.from('flow_steps').select('subject, body').eq('flow_id', req.query.id).eq('is_active', true);
      const problems = (steps || []).filter((s) => !s.subject?.trim() || !s.body?.trim());
      if (!steps?.length) return res.status(422).json({ error: 'flow has no active steps' });
      if (problems.length) return res.status(422).json({ error: 'one or more active steps is missing a subject or body' });
      patch.status = 'active';
      patch.approved_at = new Date().toISOString();
      patch.approved_by = ownerEmail;
    } else if (status) {
      patch.status = status;
    }

    const { data, error } = await db.from('flows').update(patch).eq('id', req.query.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ flow: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
