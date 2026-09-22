// Prospect research -> personalized outreach draft. Directly mirrors
// 360PrintStudio's backend/src/services/prospectEmail.js -- same model, same
// server-side web_search + web_fetch tool pattern, same "the verdict matters
// more than the email" philosophy (skip is a success, not a failure). The
// only real difference is the positioning brief is track-specific
// (positioning/ic.md or positioning/b2b.md) instead of one fixed file, since
// this system runs two pitches instead of one.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.PROSPECT_MODEL || 'claude-sonnet-5';
const MAX_SEARCHES = Number(process.env.PROSPECT_MAX_SEARCHES || 8);

const SENDER_NAME = { ic: 'Jose Villegas', b2b: 'Ubik 360' };

function loadPositioning(track) {
  const p = path.join(__dirname, 'positioning', `${track}.md`);
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new Error(`Positioning file missing at ${p}: ${err.message}`);
  }
}

function buildPrompt({ track, name, company, urls, notes }) {
  const sender = SENDER_NAME[track] || 'Ubik 360';
  return `You are helping ${sender} decide whether to write a personal outreach email to a
business -- and if so, draft it.

## Positioning
This is the canonical brief. Follow it exactly -- especially the disqualifiers, which exist to
stop a generic pitch being forced onto a prospect it doesn't fit.

<positioning>
${loadPositioning(track)}
</positioning>

## Research the prospect
Read EVERY url given below, then SEARCH for what wasn't given. Look for:
- What the business actually does, its size, and who the decision-maker likely is.
- Specific, checkable facts that make this pitch relevant to THIS business (not generic).
- An owner's or manager's first name, preferring the site or reviews over directories.

## Decide the pitch
Work through the positioning brief's numbered options and pick the ONE that best fits this
specific business, based on what research actually found -- never invent a signal that wasn't
found. Choosing "skip" is a success, not a failure -- but skip only for "no honest reason for
THIS business to care," never for being the wrong type of business outright.

## Write like a person, not marketing
First person, direct, no hype, no "I'm excited to reach out." Short. Reference the specific
finding from research that makes this relevant.

## Prospect
Name: ${name || '(unknown)'}
Company: ${company || '(infer from the urls)'}
URLs to research:
${urls.map((u) => `- ${u}`).join('\n')}
${notes ? `\nKnown notes (weigh these heavily):\n${notes}` : ''}

## Output -- return ONLY this JSON, no prose around it
{
  "company": "...",
  "business_unit": "... (one of the options from the positioning brief, or 'skip')",
  "what_they_do": "one line -- what this business actually is",
  "fit": "strong" | "possible" | "skip",
  "decisive_signal": "the specific research finding this pitch rests on",
  "confidence": "high" | "medium" | "low",
  "findings": ["specific fact found, with the source it came from", "..."],
  "why": "2-3 sentences: why this pitch, or why to skip. Be blunt.",
  "risks": ["anything that would make this email land badly", "..."],
  "subject": "...",
  "body": "the full email, ready to paste, signed off appropriately for the sender",
  "sources_read": ["url or source actually read", "..."]
}
If fit is "skip", still fill subject/body with the best available attempt but make "why" explain
clearly that sending is not recommended.`;
}

/** One streamed call with server-side web search+fetch (same mechanics as
 *  360PrintStudio's prospectEmail.js -- see that file's comments for why
 *  streaming, why the pause_turn resume loop, and why max_tokens=32000). */
export async function research({ track, name, company, urls, notes }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);

  const messages = [{ role: 'user', content: buildPrompt({ track, name, company, urls, notes }) }];
  const blocks = [];
  let stopReason = null;

  for (let round = 0; round < 4; round += 1) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 32000,
        output_config: { effort: 'medium' },
        stream: true,
        tools: [
          { type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES },
          { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: MAX_SEARCHES },
        ],
        messages: round === 0 ? messages : [...messages, { role: 'assistant', content: blocks }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);

    const decoder = new TextDecoder();
    let buffer = '';
    blocks.length = 0;
    stopReason = null;

    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        let ev;
        try { ev = JSON.parse(line.slice(6)); } catch { continue; }

        if (ev.type === 'content_block_start') blocks.push(structuredClone(ev.content_block));
        else if (ev.type === 'content_block_delta') {
          const b = blocks[ev.index];
          if (!b) continue;
          if (ev.delta.type === 'text_delta') b.text = (b.text ?? '') + ev.delta.text;
          else if (ev.delta.type === 'input_json_delta') b._partial = (b._partial ?? '') + ev.delta.partial_json;
        } else if (ev.type === 'content_block_stop') {
          const b = blocks[ev.index];
          if (b?._partial) { try { b.input = JSON.parse(b._partial); } catch {} delete b._partial; }
        } else if (ev.type === 'message_delta' && ev.delta?.stop_reason) {
          stopReason = ev.delta.stop_reason;
        }
      }
    }
    if (stopReason !== 'pause_turn') break;
  }

  if (stopReason === 'refusal') throw new Error('The model declined to draft this one.');
  if (stopReason === 'max_tokens') {
    throw new Error('The research ran past its token limit and the draft was cut off.');
  }

  const text = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const json = text.match(/\{[\s\S]*\}/);
  if (!json) throw new Error('No JSON in the response -- the research came back unusable.');
  try {
    return JSON.parse(json[0]);
  } catch (err) {
    throw new Error(`The research came back as malformed JSON: ${err.message}`);
  }
}
