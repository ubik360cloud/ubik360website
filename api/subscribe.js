// Vercel serverless function (auto-detected from the root /api directory --
// no Astro adapter/output-mode change needed since this sits alongside the
// static build, not inside it). Keeps the Brevo API key server-side only;
// the client never sees it.
//
// Two sources feed this, mapped server-side to two different Brevo lists so
// a client can't just POST an arbitrary listId:
//   - "newsletter" (default) -> list 2 -- NewsletterInline.astro, NewsletterPopup.astro
//   - "contact"              -> list 3 -- en/contact.astro, es/contacto.astro (fired
//     best-effort after Formspree succeeds, doesn't block the redirect)
// Both list IDs are overridable via BREVO_LIST_NEWSLETTER / BREVO_LIST_CONTACT
// env vars without a code change. Requires BREVO_API_KEY to be set in Vercel
// project settings -- NOTE: env var changes only apply to deployments
// created after the var was added, so a fresh deploy is needed once it's set.
const LISTS = {
  newsletter: Number(process.env.BREVO_LIST_NEWSLETTER) || 2,
  contact: Number(process.env.BREVO_LIST_CONTACT) || 3,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, lang, source } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const listId = LISTS[source] ?? LISTS.newsletter;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: { LANG: lang === 'en' ? 'EN' : 'ES' },
      }),
    });

    if (brevoRes.ok) {
      return res.status(200).json({ ok: true });
    }

    const data = await brevoRes.json().catch(() => ({}));
    // updateEnabled:true should prevent this, but treat an existing contact
    // as a successful subscription either way rather than surfacing an error.
    if (brevoRes.status === 400 && data.code === 'duplicate_parameter') {
      return res.status(200).json({ ok: true });
    }

    console.error('Brevo API error', brevoRes.status, data);
    return res.status(502).json({ error: 'Subscription failed' });
  } catch (err) {
    console.error('Brevo request failed', err);
    return res.status(500).json({ error: 'Subscription failed' });
  }
}
