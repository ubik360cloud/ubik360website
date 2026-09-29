// Sends via Brevo's transactional API (distinct from api/subscribe.js's
// "add contact to list" call). Plain text only, deliberately -- these are
// meant to read as personal 1:1 emails, and 360PrintStudio's own incident
// (HTML-only mail scored down by Gmail, landed in spam) is the cautionary
// tale for why plain text is the safer default here too.
const SENDERS = {
  ic: { email: 'jose@ubik360.com', name: 'Jose Villegas' },
  b2b: { email: 'grow@ubik360.com', name: 'Ubik 360' },
};

// Applies to every send, both tracks -- Jose signs cold outreach personally
// (2026-09-25) regardless of the website's separate anonymous-positioning
// test (that's a site-content decision, not an email one). No accent on
// "Jose" and no "Founder" -- his own preference, CEO title is enough.
const SIGNATURE = '\n\nJose M. Villegas, CEO Ubik 360';

const OPT_OUT = '\n\n---\nIf you\'d rather not hear from me again, just reply "unsubscribe" and I\'ll stop.\nUbik 360 Enterprises LLC, 30 N Gould St Ste R, Sheridan, WY 82801';

// Always appends -- a prior version skipped this whenever the body already
// contained "Villegas" anywhere, meant to avoid double-signing an
// AI-drafted email that self-introduced inline. In practice this silently
// dropped the real closing signature the one time it mattered most: Jose
// hand-editing a body to mention his own name/title, expecting the
// standard closing signature to still follow. Consistency ("always
// signed the same way") matters more here than avoiding an occasional
// redundant mid-body self-introduction.
export function ensureSignature(body) {
  return `${body}${SIGNATURE}`;
}

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
      textContent: ensureOptOut(ensureSignature(text)),
      // Gmail/Outlook show a real "Unsubscribe" link next to the sender
      // name when this header is present, on top of the plain-text
      // reply-to-unsubscribe instructions in the body itself -- the body
      // stays plain text (no HTML, no styled button), this is just a
      // header, and it's a real Gmail/Yahoo bulk-sender deliverability
      // best practice even at this volume.
      headers: { 'List-Unsubscribe': `<mailto:${sender.email}?subject=unsubscribe>` },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brevo send failed ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
