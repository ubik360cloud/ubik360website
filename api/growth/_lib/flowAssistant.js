// Drafts a starting flow (name + multi-step email sequence) for a specific
// segment -- an apollo_weekly_plans row, since its label/brief/filter
// already describe exactly who the segment is and why it was built. Same
// Uses the shared LLM funnel in llm.js -- switched from DeepInfra/DeepSeek-V3
// to OpenAI gpt-4o-mini 2026-09-28 (Jose: email copy quality was poor).
// Always a draft: the flow is created with status 'draft' and every step
// lands in the editable Flows UI -- nothing sends until Jose reviews,
// edits, and clicks "Approve & activate" there, same gate as a hand-written
// flow.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatComplete, parseJsonResponse } from './llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SENDER_NAME = { ic: 'Jose Villegas', b2b: 'Ubik 360' };
// Jose's real Calendly link (confirmed 2026-09-25) -- proposed as the CTA
// on whichever step actually warrants a scheduling ask, with a labeled
// caption per language ("Let's Talk" / "¿Hablamos?") since these are
// plain-text emails with no styled button.
const CALENDLY_URL = 'https://calendly.com/meet-ubik360/30min';
const CTA_LABEL = { en: "Let's Talk", es: '¿Hablamos?' };

// Language follows the segment's geography, not the track -- b2b covers
// both Colombia and the US/Canada, and Jose wants Colombian recipients
// emailed in (Latin American) Spanish, US/Canada recipients in English.
// Only the actual email content (subject/body) switches; name/description
// are Jose's own admin-facing metadata and stay in English regardless, so
// the Flows list is consistently scannable.
const SPANISH_LATAM_COUNTRIES = [
  'colombia', 'mexico', 'méxico', 'argentina', 'chile', 'peru', 'perú', 'ecuador', 'venezuela',
  'bolivia', 'paraguay', 'uruguay', 'panama', 'panamá', 'costa rica', 'guatemala', 'honduras',
  'el salvador', 'nicaragua', 'dominican republic', 'república dominicana',
];

function detectLanguage(plan) {
  const locs = [
    ...(plan?.filter?.organization_locations || []),
    ...(plan?.filter?.person_locations || []),
  ].map((s) => String(s).toLowerCase());
  const isLatam = locs.some((l) => SPANISH_LATAM_COUNTRIES.some((c) => l.includes(c)));
  return isLatam ? 'es' : 'en';
}

function loadPositioning(track) {
  try {
    return fs.readFileSync(path.join(__dirname, 'positioning', `${track}.md`), 'utf8');
  } catch {
    return '(no positioning file found)';
  }
}

function buildPrompt({ track, plan, instructions }) {
  const sender = SENDER_NAME[track] || 'Ubik 360';
  const language = detectLanguage(plan);
  const languageInstruction = language === 'es'
    ? 'Write every "subject" and "body" in Latin American Spanish (use "tú", not "vosotros" or Spain-specific slang) -- this segment\'s contacts are in a Spanish-speaking country. Keep "name" and "description" in English (Jose\'s own internal admin labels, not sent to anyone).'
    : 'Write every "subject" and "body" in English.';

  const segmentSection = plan
    ? `## This segment -- who these contacts actually are and why they were targeted
- Label: ${plan.label || '(standard weekly plan, no label)'}
- Why this segment was built: ${plan.brief || plan.rationale || '(no brief given)'}
- Apollo filter used (for context on titles/geography/industry targeted): ${JSON.stringify(plan.filter)}`
    : `## Segment
No specific Apollo segment is linked to this flow -- draft generically for this track's
positioning and whatever Jose's instructions below describe about the intended audience.`;

  const instructionsSection = instructions?.trim()
    ? `## Jose's specific instructions for THIS flow -- follow these closely
These are specific to this exact flow and take priority over the generic defaults below wherever
they conflict (e.g. if he asks for a different tone, structure, number of steps, or something
particular to mention or avoid):
<instructions>
${instructions.trim()}
</instructions>`
    : '';

  return `You are drafting a cold-outreach EMAIL SEQUENCE (a "flow") for ${sender} to send to a
specific segment of contacts. You do NOT decide anything final -- a human always reviews and
edits every subject/body before this flow can activate, so prefer clear and reasonably short over
maximally clever.

## This track's positioning (who we are, what we sell, who we target)
<positioning>
${loadPositioning(track)}
</positioning>

${segmentSection}

${instructionsSection}

## Language
${languageInstruction}

## Signature -- do NOT write one
Every email gets "Jose M. Villegas, CEO Ubik 360" appended automatically after your body text,
before it sends. Do not write a name, title, or sign-off anywhere in "body" -- no "Jose here",
no "soy Jose de Ubik 360", no closing "Best, Jose". Write the body as if that line will follow it.

## CTA
Exactly one step (usually the one making the actual ask to talk) should carry a scheduling CTA:
set "cta_url" to "${CALENDLY_URL}" and "cta_label" to "${CTA_LABEL[language]}" on that step only.
Leave "cta_url" and "cta_label" null on every other step -- don't repeat the same link every step.

## Output -- return ONLY this JSON, no prose around it, no markdown code fence
{
  "name": "short flow name, e.g. 'Colombia marketing directors - manufacturing'",
  "description": "1-2 sentences: who this reaches and the angle",
  "steps": [
    { "step_no": 1, "delay_hours": 0, "subject": "...", "body": "...", "cta_url": null, "cta_label": null },
    { "step_no": 2, "delay_hours": 96, "subject": "...", "body": "...", "cta_url": "${CALENDLY_URL}", "cta_label": "${CTA_LABEL[language]}" }
  ]
}
2-3 steps is usually right (an opener, a follow-up, maybe a short breakup message) -- don't pad to
a fixed number. Bodies are plain text, first person, no hype, no "I hope this finds you well" /
"I'm excited to reach out" (or the equivalent stock opener in Spanish). Every step should reference
the segment's actual industry/geography/role generically (this is a template for the whole
segment, not a 1:1 personalized email -- don't invent a specific company name or person's name).
delay_hours is hours after the PREVIOUS step (0 for step 1).`;
}

/** `plan` is optional -- a flow with no linked segment still gets a draft,
 *  just grounded only in the track's positioning + whatever `instructions`
 *  says instead of a specific Apollo filter's targeting. `instructions` is
 *  Jose's free-text ask for this specific flow (tone, structure, what to
 *  mention/avoid) -- see the Flows page's "Context for this flow" box. */
export async function proposeFlow({ track, plan, instructions }) {
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);
  if (!plan && !instructions?.trim()) throw new Error('Give either a linked segment or some instructions to draft from.');

  const prompt = buildPrompt({ track, plan, instructions });
  const text = await chatComplete(prompt, { maxTokens: 1800, temperature: 0.4 });
  return parseJsonResponse(text, 'draft');
}
