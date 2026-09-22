// Brevo webhook -- bounces/complaints/opens/clicks on transactional sends.
// Auto-suppresses on hard bounce or spam complaint. Configure in Brevo:
// Settings -> Webhooks -> Transactional -> point at
// https://ubik360.com/api/growth/webhooks/brevo?secret=<GROWTH_WEBHOOK_SECRET>.
//
// Known gap (not built yet): reply detection needs an IMAP poll of
// jose@/grow@ (mirrors 360PrintStudio's manny@go. poller) -- out of scope
// for v1 at 10 sends/day; replies are checked manually for now.
import { supabase } from '../_lib/supabase.js';

const EVENT_MAP = {
  delivered: 'delivered',
  opened: 'opened',
  click: 'clicked',
  hard_bounce: 'bounced',
  soft_bounce: 'bounced',
  spam: 'complained',
  unsubscribed: 'unsubscribed',
};

export async function brevo(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.query.secret !== process.env.GROWTH_WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const payload = req.body || {};
  const email = payload.email;
  const brevoEvent = payload.event;
  const mapped = EVENT_MAP[brevoEvent];
  if (!email || !mapped) return res.status(200).json({ ok: true, ignored: true });

  const db = supabase();
  const { data: contact } = await db.from('contacts').select('id, track').eq('email', email).maybeSingle();

  await db.from('email_events').insert({
    contact_id: contact?.id || null,
    track: contact?.track || null,
    direction: 'inbound',
    event_type: mapped,
    meta: { brevo_event: brevoEvent },
  });

  if (mapped === 'bounced' && payload.event === 'hard_bounce') {
    await db.from('suppressions').upsert({ email, reason: 'bounced' }, { onConflict: 'email' });
    if (contact) await db.from('contacts').update({ status: 'bounced' }).eq('id', contact.id);
  }
  if (mapped === 'complained') {
    await db.from('suppressions').upsert({ email, reason: 'complained' }, { onConflict: 'email' });
    if (contact) await db.from('contacts').update({ status: 'complained' }).eq('id', contact.id);
  }
  if (mapped === 'unsubscribed') {
    await db.from('suppressions').upsert({ email, reason: 'unsubscribed' }, { onConflict: 'email' });
    if (contact) await db.from('contacts').update({ status: 'unsubscribed' }).eq('id', contact.id);
  }

  return res.status(200).json({ ok: true });
}
