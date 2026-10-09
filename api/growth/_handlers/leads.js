import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

const VALID_STAGES = ['new', 'contacted', 'engaged', 'replied', 'in_conversation', 'won', 'lost', 'disqualified'];

export const list = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  let query = db
    .from('leads')
    .select('*, contacts(email, first_name, last_name, company, title)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (req.query.track) query = query.eq('track', req.query.track);
  if (req.query.stage) query = query.eq('stage', req.query.stage);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const board = {};
  for (const lead of data || []) board[lead.stage] = (board[lead.stage] || 0) + 1;
  return res.status(200).json({ leads: data || [], board });
});

export const detail = withOwner(async (req, res, ownerEmail) => {
  const db = supabase();
  if (req.method === 'GET') {
    const [{ data: lead, error }, { data: events }] = await Promise.all([
      db.from('leads').select('*, contacts(*)').eq('id', req.params.id).single(),
      db.from('lead_events').select('*').eq('lead_id', req.params.id).order('created_at', { ascending: false }),
    ]);
    if (error) return res.status(404).json({ error: 'lead not found' });
    return res.status(200).json({ lead, events: events || [] });
  }

  if (req.method === 'PATCH') {
    const { stage, owner, notes, next_action, next_action_due, note } = req.body || {};
    if (stage && !VALID_STAGES.includes(stage)) return res.status(400).json({ error: 'invalid stage' });

    const patch = {};
    if (stage) patch.stage = stage;
    if (owner !== undefined) patch.owner = owner;
    if (notes !== undefined) patch.notes = notes;
    if (next_action !== undefined) patch.next_action = next_action;
    if (next_action_due !== undefined) patch.next_action_due = next_action_due;

    const { data, error } = await db.from('leads').update(patch).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (stage) await db.from('lead_events').insert({ lead_id: req.params.id, event_type: 'stage_change', payload: { stage, by: ownerEmail } });
    if (note) await db.from('lead_events').insert({ lead_id: req.params.id, event_type: 'note', payload: { text: note, by: ownerEmail } });

    return res.status(200).json({ lead: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
