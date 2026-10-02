// Mirrors api/growth/_lib/sendgrid.js's SIGNATURE/OPT_OUT and
// api/growth/_lib/flowEngine.js's buildStepBody/personalize -- duplicated
// here (this is a separate frontend app, nothing to import from) purely so
// a draft's editor can show a live preview of the exact email that will
// send, including the auto-appended signature/opt-out a draft's own body
// never contains. Keep this in sync if either backend file's copy changes.
const SIGNATURE = {
  en: '\n\nBest,\n\nJose M. Villegas\nCEO Ubik 360\nUbik360.com',
  es: '\n\nSaludos,\n\nJose M. Villegas\nCEO Ubik 360\nUbik360.com',
};

const OPT_OUT = {
  en: '\n\n---\nIf you\'d rather not hear from me again, just reply "unsubscribe" and I\'ll stop.\nUbik 360 Enterprises LLC, 30 N Gould St Ste R, Sheridan, WY 82801',
  es: '\n\n---\nSi prefiere no recibir más mensajes míos, simplemente responda "cancelar" y no le volveré a escribir.\nUbik 360 Enterprises LLC, 30 N Gould St Ste R, Sheridan, WY 82801',
};

function appendFooter(body, language) {
  const lang = language === 'es' ? 'es' : 'en';
  return `${body}${SIGNATURE[lang]}${OPT_OUT[lang]}`;
}

function buildStepBody(body, ctaLabel, ctaUrl) {
  if (!ctaUrl) return body;
  const cta = ctaLabel ? `${ctaLabel}: ${ctaUrl}` : ctaUrl;
  return `${body}\n\n${cta}`;
}

/** Full preview of a flow step's email exactly as a contact will receive it
 *  -- {{first_name}} shown as a literal placeholder (there's no specific
 *  contact to substitute here, same placeholder sendTestEmail() uses), CTA
 *  appended, signature + opt-out footer added. */
export function previewFlowStep({ body, ctaLabel, ctaUrl, language }) {
  const placeholder = language === 'es' ? '[Nombre]' : '[First Name]';
  const withCta = buildStepBody(body || '', ctaLabel, ctaUrl);
  const withName = withCta.split('{{first_name}}').join(placeholder);
  return appendFooter(withName, language);
}

/** Full preview of a 1:1 draft's email -- no CTA field, no {{first_name}}
 *  token (the draft already greets the contact by their real name), just
 *  the signature + opt-out footer appended. */
export function previewOneoff({ body, language }) {
  return appendFooter(body || '', language);
}
