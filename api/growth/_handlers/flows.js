import { withOwner } from '../_lib/auth.js';
import { withCron } from '../_lib/cron.js';
import { supabase } from '../_lib/supabase.js';
import { enrollContact, runDueSteps } from '../_lib/flowEngine.js';

export const listCreate = withOwner(async (req, res) => {
  const db = supabase();
  if (req.method === 'GET') {
    let query = db.from('flows').select('*, flow_steps(count), enrollments(count)').order('created_at', { ascending: false });
    if (req.query.track) query = query.eq('track', req.query.track);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ flows: data || [] });
  }

  if (req.method === 'POST') {
    const { track, name, description, send_window, per_contact_min_gap_hours } = req.body || {};
    if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { data, error } = await db
      .from('flows')
      .insert({ track, name, description, send_window, per_contact_min_gap_hours })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ flow: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

export const detail = withOwner(async (req, res, ownerEmail) => {
  const db = supabase();
  if (req.method === 'GET') {
    const [{ data: flow, error }, { data: steps }, { data: enrollments }] = await Promise.all([
      db.from('flows').select('*').eq('id', req.params.id).single(),
      db.from('flow_steps').select('*').eq('flow_id', req.params.id).order('step_no'),
      db.from('enrollments').select('status').eq('flow_id', req.params.id),
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
      const { data: steps } = await db.from('flow_steps').select('subject, body').eq('flow_id', req.params.id).eq('is_active', true);
      const problems = (steps || []).filter((s) => !s.subject?.trim() || !s.body?.trim());
      if (!steps?.length) return res.status(422).json({ error: 'flow has no active steps' });
      if (problems.length) return res.status(422).json({ error: 'one or more active steps is missing a subject or body' });
      patch.status = 'active';
      patch.approved_at = new Date().toISOString();
      patch.approved_by = ownerEmail;
    } else if (status) {
      patch.status = status;
    }

    const { data, error } = await db.from('flows').update(patch).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ flow: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

export const steps = withOwner(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const { steps: newSteps } = req.body || {};
  if (!Array.isArray(newSteps) || !newSteps.length) return res.status(400).json({ error: 'steps array is required' });

  const db = supabase();
  await db.from('flow_steps').delete().eq('flow_id', req.params.id);
  const rows = newSteps.map((s, i) => ({
    flow_id: req.params.id,
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

export const enroll = withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { contact_ids } = req.body || {};
  if (!Array.isArray(contact_ids) || !contact_ids.length) return res.status(400).json({ error: 'contact_ids array is required' });

  let enrolled = 0;
  const skipped = {};
  for (const contactId of contact_ids) {
    const r = await enrollContact({ flowId: req.params.id, contactId, enrolledBy: ownerEmail });
    if (r.ok) enrolled += 1; else skipped[r.skipped] = (skipped[r.skipped] || 0) + 1;
  }
  return res.status(200).json({ enrolled, skipped });
});

export const run = withCron(async (req, res) => {
  try {
    const result = await runDueSteps();
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error('[flows/run] failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
});
