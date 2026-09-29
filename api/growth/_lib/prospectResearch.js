// Prospect research -> personalized outreach draft. Originally mirrored
// 360PrintStudio's prospectEmail.js (Claude + native server-side web_search/
// web_fetch tools); switched to DeepInfra 2026-09 per Jose (Anthropic API
// cost), then to OpenAI gpt-4o-mini 2026-09-28 (Jose: DeepSeek-V3 email copy
// quality was poor) -- see llm.js for the provider funnel. Whichever
// provider is active has no built-in "go search the web" capability, so
// this fetches the given URL itself (plain HTTP, no AI, no extra paid
// search API) and hands the page text to the model instead of letting it
// browse autonomously. Trade-off: the model can no longer discover pages it
// wasn't given (e.g. an unlinked partners page) -- if that turns out to
// matter, add a search API as its own step later, don't build it
// preemptively. The "verdict matters more than the email" philosophy and
// JSON output shape are unchanged from the original.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatComplete, parseJsonResponse } from './llm.js';
import { detectLanguage } from './language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FETCH_TIMEOUT_MS = 10000;
const MAX_PAGE_CHARS = 6000; // keeps the prompt (and cost) small

const SENDER_NAME = { ic: 'Jose Villegas', b2b: 'Ubik 360' };

function loadPositioning(track) {
  const p = path.join(__dirname, 'positioning', `${track}.md`);
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`Positioning file missing at ${p}: ${err.message}`);
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain HTTP fetch + tag-strip, no AI involved -- the deterministic,
 *  zero-cost replacement for the "give the model a URL to read" half of
 *  what the old web_fetch tool did. Returns null on any failure so one bad
 *  URL doesn't kill the whole research call. */
async function fetchPageText(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Ubik360GrowthBot/1.0)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return stripHtml(html).slice(0, MAX_PAGE_CHARS);
  } catch (e) {
    console.error(`[prospectResearch] fetch failed for ${url}:`, e.message);
    return null;
  }
}

function buildPrompt({ track, name, company, notes, pages, country }) {
  const sender = SENDER_NAME[track] || 'Ubik 360';
  const language = detectLanguage([country]);
  const languageInstruction = language === 'es'
    ? 'Write "subject" and "body" in Latin American Spanish (use "tú", not "vosotros" or Spain-specific slang) -- this prospect is in a Spanish-speaking country. Every other field (business_unit, what_they_do, why, findings, risks) stays in English -- internal notes for Jose, never sent.'
    : 'Write "subject" and "body" in English.';
  const pageBlocks = pages
    .map((p) => (p.text
      ? `<page url="${p.url}">\n${p.text}\n</page>`
      : `<page url="${p.url}">(could not be fetched -- work from name/company only, don't invent content for this page)</page>`))
    .join('\n\n');

  return `You are helping ${sender} decide whether to write a personal outreach email to a
business -- and if so, draft it.

## Positioning
This is the canonical brief. Follow it exactly -- especially the disqualifiers, which exist to
stop a generic pitch being forced onto a prospect it doesn't fit.

<positioning>
${loadPositioning(track)}
</positioning>

## Research the prospect
Below is the raw text fetched from the prospect's own website. Use ONLY what's actually in this
text (or the name/company given) -- never invent a fact, page, or detail that isn't here. If the
page content is thin or a fetch failed, that's a real signal to lower confidence or skip, not a
reason to guess.

${pageBlocks}

Look for:
- What the business actually does, its size, and who the decision-maker likely is.
- Specific, checkable facts that make this pitch relevant to THIS business (not generic).
- An owner's or manager's first name, if actually present in the text.

## Decide the pitch
Work through the positioning brief's numbered options and pick the ONE that best fits this
specific business, based only on what's in the fetched text above -- never invent a signal that
wasn't found. Choosing "skip" is a success, not a failure -- but skip only for "no honest reason
for THIS business to care," never for being the wrong type of business outright.

## Write like a person, not marketing
First person, direct, no hype, no "I'm excited to reach out." Short. Reference the specific
finding from the page text that makes this relevant.

## Language
${languageInstruction}

## Salutation -- required, first line of body
Open with a real greeting using the prospect's ACTUAL first name from "Name" below (just the
first name, not the full name) -- e.g. ${language === 'es' ? '"Hola Andrés,"' : '"Hi Andrew,"'}.
If the name is genuinely unknown, use a neutral greeting instead
(${language === 'es' ? '"Hola,"' : '"Hi there,"'}) -- never invent a name.

## Paragraphs -- required
Write 2-4 SHORT paragraphs separated by a blank line each -- never one solid block of text. A
natural shape: (1) the greeting + the specific finding that makes this relevant, (2) the
credibility/offer in 1-2 sentences, (3) a short question inviting a reply.

## Signature -- do NOT write one
A closing salutation ("${language === 'es' ? 'Saludos,' : 'Best,'}") and "Jose M. Villegas / CEO
Ubik 360 / Ubik360.com" get appended automatically after your body text, before it sends. Do not
write a name, title, sign-off, or closing salutation anywhere in "body" -- no "Jose here", no
"soy Jose de Ubik 360", no closing "Saludos," or "Best,". Write the body as if that whole block
will follow it directly.

## Prospect
Name: ${name || '(unknown)'}
Company: ${company || '(infer from the page content)'}
${notes ? `\nKnown notes (weigh these heavily):\n${notes}` : ''}

## Output -- return ONLY this JSON, no prose around it, no markdown code fence
{
  "company": "...",
  "business_unit": "... (one of the options from the positioning brief, or 'skip')",
  "what_they_do": "one line -- what this business actually is",
  "fit": "strong" | "possible" | "skip",
  "decisive_signal": "the specific fact from the fetched page text this pitch rests on",
  "confidence": "high" | "medium" | "low",
  "findings": ["specific fact found in the page text", "..."],
  "why": "2-3 sentences: why this pitch, or why to skip. Be blunt.",
  "risks": ["anything that would make this email land badly", "..."],
  "subject": "...",
  "body": "the full email, ready to paste, no signature (one is appended automatically)",
  "sources_read": ["url actually fetched with usable content", "..."]
}
If fit is "skip", still fill subject/body with the best available attempt but make "why" explain
clearly that sending is not recommended.`;
}

export async function research({ track, name, company, urls, notes, country }) {
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);

  const pages = await Promise.all((urls || []).map(async (u) => ({ url: u, text: await fetchPageText(u) })));
  const prompt = buildPrompt({ track, name, company, notes, pages, country });
  const text = await chatComplete(prompt, { maxTokens: 2000, temperature: 0.4 });
  const verdict = parseJsonResponse(text, 'research');
  // Computed programmatically, not asked of the model -- see flowAssistant.js's
  // identical reasoning for why this shouldn't hinge on the model echoing it back.
  verdict.language = detectLanguage([country]);
  return verdict;
}
