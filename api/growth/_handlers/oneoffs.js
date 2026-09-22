import { withOwner } from '../_lib/auth.js';
import { withCron } from '../_lib/cron.js';
import { supabase } from '../_lib/supabase.js';
import { dailyOneoffPull } from '../_lib/oneoffQueue.js';
import { sendEmail } from '../_lib/brevo.js';
import { reserveSendSlot } from '../_lib/sendCap.js';

export const list = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  let query = db
    .from('oneoffs')
    .select('*, contacts(email, first_name, last_name, company, title)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.track) query = query.eq('track', req.query.track);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ oneoffs: data || [] });
});

export const pull = withCron(async (req, res) => {
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

export const update = withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { subject, body, status } = req.body || {};
  if (status && !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
  }
  const patch = {};
  if (subject !== undefined) patch.subject = subject;
  if (body !== undefined) patch.body = body;
  if (status) {
    patch.status = status;
    patch.approved_at = new Date().toISOString();
    patch.approved_by = ownerEmail;
  }
  const db = supabase();
  const { data, error } = await db.from('oneoffs').update(patch).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ oneoff: data });
});

export const send = withOwner(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();

  const { data: draft, error } = await db
    .from('oneoffs')
    .select('*, contacts(id, email, do_not_contact, status)')
    .eq('id', req.params.id)
    .single();
  if (error || !draft) return res.status(404).json({ error: 'draft not found' });
  if (draft.status !== 'approved') return res.status(400).json({ error: `draft status is '${draft.status}', must be 'approved'` });
  if (draft.contacts.do_not_contact || draft.contacts.status !== 'active') {
    return res.status(400).json({ error: 'contact is not eligible to send to' });
  }
  const { data: suppressed } = await db.from('suppressions').select('email').eq('email', draft.contacts.email).maybeSingle();
  if (suppressed) return res.status(400).json({ error: 'contact is suppressed' });

  const canSend = await reserveSendSlot();
  if (!canSend) return res.status(429).json({ error: 'Daily send cap reached (10/day combined) -- try again tomorrow' });

  try {
    await sendEmail({ track: draft.track, to: draft.contacts.email, subject: draft.subject, text: draft.body });
  } catch (e) {
    return res.status(502).json({ error: `send failed: ${e.message}` });
  }

  await db.from('oneoffs').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', req.params.id);
  await db.from('email_events').insert({ contact_id: draft.contacts.id, track: draft.track, event_type: 'sent', source: 'oneoff' });
  await db.from('leads').update({ stage: 'contacted' }).eq('contact_id', draft.contacts.id);

  return res.status(200).json({ ok: true });
});
