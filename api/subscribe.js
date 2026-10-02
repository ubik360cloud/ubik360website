// Vercel serverless function (auto-detected from the root /api directory --
// no Astro adapter/output-mode change needed since this sits alongside the
// static build, not inside it). Keeps the SendGrid API key server-side
// only; the client never sees it.
//
// Replaces the earlier Brevo integration (2026-09-30, Jose: repeated
// friction with Brevo, switching everything to SendGrid -- same provider
// 360PrintStudio already uses).
//
// Two sources feed this, mapped server-side to two different SendGrid
// marketing lists so a client can't just POST an arbitrary list id:
//   - "newsletter" (default) -> SENDGRID_LIST_NEWSLETTER -- NewsletterInline.astro, NewsletterPopup.astro
//   - "contact"              -> SENDGRID_LIST_CONTACT -- en/contact.astro, es/contacto.astro (fired
//     best-effort after Formspree succeeds, doesn't block the redirect)
// Both list ids must be set in Vercel project settings as the actual list
// UUIDs from SendGrid's Marketing > Contacts > Lists UI (unlike Brevo's
// simple numeric ids, there's no sensible hardcoded default here -- the
// lists have to exist in SendGrid first). Requires SENDGRID_API_KEY too --
// NOTE: env var changes only apply to deployments created after the var
// was added, so a fresh deploy is needed once these are set.
//
// Note: the prior Brevo version also stored a LANG contact attribute.
// SendGrid's contact custom fields require a field to be created in the
// dashboard first (to get a generated field id to reference) -- not worth
// the extra setup for a single attribute at this scale, so that's dropped;
// list membership alone still distinguishes newsletter vs. contact-form
// signups.
const LISTS = {
  newsletter: process.env.SENDGRID_LIST_NEWSLETTER,
  contact: process.env.SENDGRID_LIST_CONTACT,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('SENDGRID_API_KEY is not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const listId = LISTS[source] || LISTS.newsletter;
  if (!listId) {
    console.error(`No SendGrid list configured for source '${source || 'newsletter'}'`);
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const sgRes = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        list_ids: [listId],
        contacts: [{ email }],
      }),
    });

    // This endpoint is asynchronous -- a 202 means the upsert job was
    // accepted, not that it has finished yet. Good enough here: we don't
    // need to confirm completion synchronously, just that SendGrid took it.
    if (sgRes.status === 202) {
      return res.status(200).json({ ok: true });
    }

    const data = await sgRes.json().catch(() => ({}));
    console.error('SendGrid API error', sgRes.status, data);
    return res.status(502).json({ error: 'Subscription failed' });
  } catch (err) {
    console.error('SendGrid request failed', err);
    return res.status(500).json({ error: 'Subscription failed' });
  }
}
