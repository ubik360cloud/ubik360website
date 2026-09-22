// Sends via Brevo's transactional API (distinct from api/subscribe.js's
// "add contact to list" call). Plain text only, deliberately -- these are
// meant to read as personal 1:1 emails, and 360PrintStudio's own incident
// (HTML-only mail scored down by Gmail, landed in spam) is the cautionary
// tale for why plain text is the safer default here too.
const SENDERS = {
  ic: { email: 'jose@ubik360.com', name: 'Jose Villegas' },
  b2b: { email: 'grow@ubik360.com', name: 'Ubik 360' },
};

const OPT_OUT = '\n\n---\nIf you\'d rather not hear from me again, just reply "unsubscribe" and I\'ll stop.\nUbik 360 Enterprises LLC, 30 N Gould St Ste R, Sheridan, WY 82801';

export function ensureOptOut(body) {
  return body.includes('unsubscribe') ? body : `${body}${OPT_OUT}`;
}

/** Sends one plain-text email via Brevo. Throws on failure -- callers decide
 *  how to record/retry, this function has no side effects beyond the send. */
export async function sendEmail({ track, to, subject, text, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set');
  const sender = SENDERS[track];
  if (!sender) throw new Error(`Unknown track '${track}'`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      replyTo: replyTo ? { email: replyTo } : sender,
      subject,
      textContent: ensureOptOut(text),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brevo send failed ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
