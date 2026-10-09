// SendGrid Event Webhook -- bounces/complaints/opens/clicks on transactional
// sends. Auto-suppresses on hard bounce or spam complaint. Configure in
// SendGrid: Settings -> Mail Settings -> Event Webhook -> HTTP Post URL
// https://ubik360.com/api/growth/webhooks/sendgrid?secret=<GROWTH_WEBHOOK_SECRET>.
// Unlike Brevo's webhook (one event object per call), SendGrid always
// batches events into a JSON array per POST -- this handler loops over it.
//
// Known gap (not built yet): reply detection needs an IMAP poll of
// jose@/grow@ (mirrors 360PrintStudio's manny@go. poller) -- out of scope
// for v1 at 10 sends/day; replies are checked manually for now.
import { supabase } from '../_lib/supabase.js';

const EVENT_MAP = {
  delivered: 'delivered',
  open: 'opened',
  click: 'clicked',
  bounce: 'bounced',
  dropped: 'bounced',
  spamreport: 'complained',
  unsubscribe: 'unsubscribed',
  group_unsubscribe: 'unsubscribed',
};

export async function sendgrid(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.query.secret !== process.env.GROWTH_WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const events = Array.isArray(req.body) ? req.body : [];
  const db = supabase();

  for (const payload of events) {
    const email = payload.email;
    const sgEvent = payload.event;
    const mapped = EVENT_MAP[sgEvent];
    if (!email || !mapped) continue;

    const { data: contact } = await db.from('contacts').select('id, track').eq('email', email).maybeSingle();

    await db.from('email_events').insert({
      contact_id: contact?.id || null,
      track: contact?.track || null,
      direction: 'inbound',
      event_type: mapped,
      meta: { sendgrid_event: sgEvent, type: payload.type, reason: payload.reason },
    });

    // Only a genuine hard bounce ("type":"bounce") suppresses permanently --
    // a soft/transient one ("type":"blocked") or a generic "dropped" (often
    // itself caused by an existing suppression) just gets logged, so it
    // isn't silently invisible without blocking a future legitimate retry.
    const isHardBounce = sgEvent === 'bounce' && payload.type === 'bounce';
    if (isHardBounce) {
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
  }

  return res.status(200).json({ ok: true });
}
