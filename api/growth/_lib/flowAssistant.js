// Drafts a starting flow (name + multi-step email sequence) for a specific
// segment -- an apollo_weekly_plans row, since its label/brief/filter
// already describe exactly who the segment is and why it was built. Same
// DeepInfra pattern as filterAssistant.js and prospectResearch.js. Always a
// draft: the flow is created with status 'draft' and every step lands in
// the editable Flows UI -- nothing sends until Jose reviews, edits, and
// clicks "Approve & activate" there, same gate as a hand-written flow.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEEPINFRA_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const MODEL = process.env.PROSPECT_MODEL || 'deepseek-ai/DeepSeek-V3';
const SENDER_NAME = { ic: 'Jose Villegas', b2b: 'Ubik 360' };

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

function buildPrompt({ track, plan }) {
  const sender = SENDER_NAME[track] || 'Ubik 360';
  const language = detectLanguage(plan);
  const languageInstruction = language === 'es'
    ? 'Write every "subject" and "body" in Latin American Spanish (use "tú", not "vosotros" or Spain-specific slang) -- this segment\'s contacts are in a Spanish-speaking country. Keep "name" and "description" in English (Jose\'s own internal admin labels, not sent to anyone).'
    : 'Write every "subject" and "body" in English -- this segment\'s contacts are in the US/Canada.';

  return `You are drafting a cold-outreach EMAIL SEQUENCE (a "flow") for ${sender} to send to a
specific segment of contacts. You do NOT decide anything final -- a human always reviews and
edits every subject/body before this flow can activate, so prefer clear and reasonably short over
maximally clever.

## This track's positioning (who we are, what we sell, who we target)
<positioning>
${loadPositioning(track)}
</positioning>

## This segment -- who these contacts actually are and why they were targeted
- Label: ${plan.label || '(standard weekly plan, no label)'}
- Why this segment was built: ${plan.brief || plan.rationale || '(no brief given)'}
- Apollo filter used (for context on titles/geography/industry targeted): ${JSON.stringify(plan.filter)}

## Language
${languageInstruction}

## Output -- return ONLY this JSON, no prose around it, no markdown code fence
{
  "name": "short flow name, e.g. 'Colombia marketing directors - manufacturing'",
  "description": "1-2 sentences: who this reaches and the angle",
  "steps": [
    { "step_no": 1, "delay_hours": 0, "subject": "...", "body": "...", "cta_url": null },
    { "step_no": 2, "delay_hours": 96, "subject": "...", "body": "...", "cta_url": null }
  ]
}
2-3 steps is usually right (an opener, a follow-up, maybe a short breakup message) -- don't pad to
a fixed number. Bodies are plain text, first person, no hype, no "I hope this finds you well" /
"I'm excited to reach out" (or the equivalent stock opener in Spanish). Every step should reference
the segment's actual industry/geography/role generically (this is a template for the whole
segment, not a 1:1 personalized email -- don't invent a specific company name or person's name).
delay_hours is hours after the PREVIOUS step (0 for step 1).`;
}

export async function proposeFlow({ track, plan }) {
  const apiKey = process.env.DEEPINFRA_UBIK30_KEY;
  if (!apiKey) throw new Error('DEEPINFRA_UBIK30_KEY is not set');
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);
  if (!plan) throw new Error('plan is required');

  const prompt = buildPrompt({ track, plan });
  const res = await fetch(DEEPINFRA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1800,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`DeepInfra API ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in the response -- the draft came back unusable.');
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`The draft came back as malformed JSON: ${err.message}`);
  }
}
