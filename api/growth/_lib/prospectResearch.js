// Prospect drafting from structured Apollo firmographic data -- no website
// fetch, no AI "research" step. Originally fetched the prospect's own site
// (plain HTTP) and handed the page text to the model; Jose flagged
// (2026-10-02) that the resulting "I noticed that [company] does X" opening
// read as fake ("saying 'I see you do this'... well it is obvious, they
// already know what they do") and that Apollo's own search/match response
// already carries enough firmographic context (headcount, industry,
// founded year, location/title) to write a direct, confident, consultative
// email without visiting anything -- cheaper (no fetch, far fewer prompt
// tokens) and more honest (never implies familiarity the sender doesn't
// have). See migration 008_firmographics.sql for where these fields
// actually come from.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatComplete, parseJsonResponse } from './llm.js';
import { detectLanguage } from './language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SENDER_NAME = { ic: 'Jose Villegas', b2b: 'Ubik 360' };

function loadPositioning(track) {
  const p = path.join(__dirname, 'positioning', `${track}.md`);
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`Positioning file missing at ${p}: ${err.message}`);
  }
}

function buildPrompt({ track, name, title, company, companySize, industry, foundedYear, country }) {
  const sender = SENDER_NAME[track] || 'Ubik 360';
  const language = detectLanguage([country]);
  const languageInstruction = language === 'es'
    ? 'Write "subject" and "body" in Latin American Spanish (use "tú", not "vosotros" or Spain-specific slang) -- this prospect is in a Spanish-speaking country. Every other field (business_unit, what_they_do, why, risks) stays in English -- internal notes for Jose, never sent.'
    : 'Write "subject" and "body" in English.';

  const facts = [
    `Contact name: ${name || '(unknown)'}`,
    `Contact title: ${title || '(unknown)'}`,
    `Company: ${company || '(unknown)'}`,
    `Industry: ${industry || '(unknown)'}`,
    `Company size: ${companySize ? `~${companySize} employees` : '(unknown)'}`,
    foundedYear ? `Founded: ${foundedYear}` : null,
    `Location: ${country || '(unknown)'}`,
  ].filter(Boolean).join('\n');

  return `You are helping ${sender} decide whether to write a personal outreach email to a
business -- and if so, draft it.

## Positioning
This is the canonical brief. Follow it exactly -- especially the disqualifiers, which exist to
stop a generic pitch being forced onto a prospect it doesn't fit.

<positioning>
${loadPositioning(track)}
</positioning>

## What you know about this prospect -- and ONLY this
${facts}

This is firmographic data from Apollo, not research you performed. There is no page text, no
"about us" section, no specific fact about what this particular company does day-to-day beyond
its industry classification. Do not invent one.

## Do NOT open by telling them what they already know
Never write "I noticed that [company] does/offers/has X" -- the business owner already knows what
their own company does; stating it back to them reads as a fake, formulaic "I read your website"
opener (precisely what to avoid). Instead, reason from industry + size: a company of THIS size in
THIS industry commonly faces or could benefit from a specific kind of problem the chosen pitch
solves -- frame it as an informed inference about businesses like theirs, not a claim about them
specifically.

## Be honest about what you don't yet know
It's a strength, not a weakness, to say directly that the real specifics (their actual processes,
systems, pain points) aren't assumed -- that's exactly what gets figured out together before
proposing anything concrete. This reads as competent and non-presumptuous, the opposite of a
generic mass-blast pitch.

## Decide the pitch
Work through the positioning brief's numbered options and pick the ONE that best fits this
prospect's industry, size, and title. Choosing "skip" is a success, not a failure -- but skip only
for "no honest reason for a business like this to care," never for being the wrong type of
business outright.

## Write like a confident consultant, not a generic marketer
First person, direct, no hype, no "I'm excited to reach out." Short. Describe the chosen service
concretely (pull the specifics from that option's own description in the positioning brief) --
don't just name it abstractly.

## Language
${languageInstruction}

## Salutation -- required, first line of body
Open with a real greeting using the prospect's ACTUAL first name from "Contact name" above (just the
first name, not the full name) -- e.g. ${language === 'es' ? '"Hola Andrés,"' : '"Hi Andrew,"'}.
If the name is genuinely unknown, use a neutral greeting instead
(${language === 'es' ? '"Hola,"' : '"Hi there,"'}) -- never invent a name.

## Paragraphs -- required
Write 2-3 SHORT paragraphs separated by a blank line each -- never one solid block of text. A
natural shape: (1) the industry/size-informed opening + the honest "we figure out specifics
together" framing, (2) the concrete offering, (3) a short direct question inviting a reply.

## Signature -- do NOT write one
A closing salutation ("${language === 'es' ? 'Saludos,' : 'Best,'}") and "Jose M. Villegas / CEO
Ubik 360 / Ubik360.com" get appended automatically after your body text, before it sends. Do not
write a name, title, sign-off, or closing salutation anywhere in "body" -- no "Jose here", no
"soy Jose de Ubik 360", no closing "Saludos," or "Best,". Write the body as if that whole block
will follow it directly.

## Output -- return ONLY this JSON, no prose around it, no markdown code fence
{
  "company": "...",
  "business_unit": "... (one of the options from the positioning brief, or 'skip')",
  "what_they_do": "one line, inferred from the industry classification only -- not a specific claim",
  "fit": "strong" | "possible" | "skip",
  "decisive_signal": "the structured fact this pitch rests on, e.g. 'manufacturing, ~45 employees, founded 1998'",
  "confidence": "high" | "medium" | "low",
  "why": "2-3 sentences: why this pitch fits this industry/size, or why to skip. Be blunt.",
  "risks": ["anything that would make this email land badly", "..."],
  "subject": "...",
  "body": "the full email, ready to paste, no signature (one is appended automatically)"
}
If fit is "skip", still fill subject/body with the best available attempt but make "why" explain
clearly that sending is not recommended.`;
}

export async function research({ track, name, title, company, companySize, industry, foundedYear, country }) {
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);

  const prompt = buildPrompt({ track, name, title, company, companySize, industry, foundedYear, country });
  const text = await chatComplete(prompt, { maxTokens: 1200, temperature: 0.4 });
  const verdict = parseJsonResponse(text, 'research');
  // Computed programmatically, not asked of the model -- see flowAssistant.js's
  // identical reasoning for why this shouldn't hinge on the model echoing it back.
  verdict.language = detectLanguage([country]);
  return verdict;
}
