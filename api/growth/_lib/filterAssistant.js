// Turns Jose's free-text context (a geography, an industry angle, titles to
// include/exclude, anything he knows about the target that a filter alone
// can't capture) into a suggested Apollo mixed_people/api_search filter --
// what Jose asked for 2026-09-24 after several rounds of him describing a
// target in chat and Claude Code hand-writing the filter each time: "we can
// better include a field... for me to help you filtering, or you can
// propose the filters... with an edit option." This proposes; the hub UI
// always shows the result as an editable form before anything is created or
// searched, so a bad suggestion costs nothing and is easy to correct.
// Same DeepInfra pattern as prospectResearch.js (see that file's own
// comment for why DeepInfra over Anthropic, and its fetch/JSON-parse shape).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEEPINFRA_URL = 'https://api.deepinfra.com/v1/openai/chat/completions';
const MODEL = process.env.PROSPECT_MODEL || 'deepseek-ai/DeepSeek-V3';

// Mirrors weeklyPlan.js's APOLLO_SEARCH_KEYS allowlist -- kept as a separate
// literal list (not imported) so this file only ever proposes keys that
// list also accepts; a key added to one without the other should fail
// loudly in testing, not silently propose a filter field the pull ignores.
const APOLLO_FILTER_DOCS = `
- person_titles (array of strings): job title keywords, e.g. ["ceo","marketing director"]. Apollo matches these as keyword/substring, so a bare word like "director" matches EVERY department's director -- use compound titles ("marketing director", "sales director") to stay narrow, unless the intent genuinely is department-agnostic (ceo/owner/president/founder are fine bare).
- include_similar_titles (boolean): let Apollo also match close title synonyms.
- person_seniorities (array): e.g. ["owner","founder","c_suite","director","manager"].
- person_locations (array of strings): the PERSON's own location, e.g. ["Canada"]. Can differ from the company's HQ (remote workers) -- prefer organization_locations for "company is based in X".
- organization_locations (array of strings): the COMPANY's HQ location.
- organization_num_employees_ranges (array of "min,max" strings): e.g. ["25,100"]. Custom ranges are fine, not just presets.
- revenue_range ({min,max}): company revenue in USD.
- q_organization_keyword_tags (array of strings): industry/business-description keywords, e.g. ["manufacturing","ecommerce"].
- q_keywords (string): free-text search across company description.
- q_organization_job_titles (array): titles the company has ACTIVE JOB POSTINGS for -- a proxy for "currently hiring for X", not who to contact.
- organization_num_jobs_range ({min,max}): number of active job postings at the company -- a "how much are they hiring" proxy.
- organization_job_posted_at_range ({min,max}, YYYY-MM-DD): only companies that posted a job in this window -- a recency/buying-intent proxy. Combining this with organization_num_jobs_range is what this codebase calls "the hiring filter" -- it can cut volume by 90%+, so only include it if the brief specifically wants high-intent-only targeting.
- currently_using_any_of_technology_uids / currently_using_all_of_technology_uids / currently_not_using_any_of_technology_uids (arrays): tech-stack filters, rarely relevant here unless the brief mentions specific software.
- not_organization_websites_list (array): domains to explicitly exclude.
`.trim();

function loadPositioning(track) {
  try {
    return fs.readFileSync(path.join(__dirname, 'positioning', `${track}.md`), 'utf8');
  } catch {
    return '(no positioning file found)';
  }
}

function buildPrompt({ track, brief, priorFilter }) {
  return `You are helping propose an Apollo.io "mixed_people/api_search" filter for a cold-outreach
campaign. You do NOT decide anything final -- a human always reviews and edits your suggestion
before it runs, so prefer a clear, reasonably narrow first attempt over a maximally clever one.

## This track's positioning (who we are, what we sell, who we target)
<positioning>
${loadPositioning(track)}
</positioning>

## Real Apollo filter fields you may use -- do not invent field names outside this list
${APOLLO_FILTER_DOCS}

## Jose's context for this specific campaign
<brief>
${brief}
</brief>
${priorFilter ? `\n## The filter currently in the edit form (Jose may be asking you to adjust THIS, not start over)\n${JSON.stringify(priorFilter, null, 2)}\n` : ''}

## Output -- return ONLY this JSON, no prose around it, no markdown code fence
{
  "label": "short-kebab-case-label, e.g. colombia-marketing-directors-test",
  "rationale": "1-3 sentences: who this targets and why, in plain language for a human reviewing it",
  "target": 10,
  "filter": { /* only real keys from the list above */ }
}
Keep "target" modest (10-30) unless the brief explicitly asks for a bigger pull. If the brief is
too vague to propose a sensible filter (no geography, no industry/title signal at all), still
return valid JSON but set "rationale" to explain what's missing and make "filter" your best
narrow guess, never an empty object.`;
}

export async function proposeFilter({ track, brief, priorFilter }) {
  const apiKey = process.env.DEEPINFRA_UBIK30_KEY;
  if (!apiKey) throw new Error('DEEPINFRA_UBIK30_KEY is not set');
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);
  if (!brief || !brief.trim()) throw new Error('brief is required');

  const prompt = buildPrompt({ track, brief, priorFilter });
  const res = await fetch(DEEPINFRA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`DeepInfra API ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in the response -- the suggestion came back unusable.');
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`The suggestion came back as malformed JSON: ${err.message}`);
  }
}
