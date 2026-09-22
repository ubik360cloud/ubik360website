// Sends one approved draft now. QA-gated (must be status='approved') and
// cap/suppression-checked -- the send cap is shared across both tracks and
// both send paths (oneoffs + flow steps), enforced atomically in Postgres.
import { withOwner } from '../../_lib/auth.js';
import { supabase } from '../../_lib/supabase.js';
import { sendEmail } from '../../_lib/brevo.js';
import { reserveSendSlot } from '../../_lib/sendCap.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();

  const { data: draft, error } = await db
    .from('oneoffs')
    .select('*, contacts(id, email, do_not_contact, status)')
    .eq('id', req.query.id)
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

  await db.from('oneoffs').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', req.query.id);
  await db.from('email_events').insert({ contact_id: draft.contacts.id, track: draft.track, event_type: 'sent', source: 'oneoff' });
  await db.from('leads').update({ stage: 'contacted' }).eq('contact_id', draft.contacts.id);

  return res.status(200).json({ ok: true });
});
