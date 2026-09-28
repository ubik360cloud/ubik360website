// Single funnel for every LLM call in this codebase (filter suggestions,
// flow drafts, 1:1 prospect research) -- extracted after switching
// providers twice already (Anthropic -> DeepInfra -> OpenAI, 2026-09-28,
// Jose: DeepInfra/DeepSeek-V3 email copy quality was poor) so the next
// switch is a one-file change instead of touching every caller.
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    keyEnv: 'OPENAI_API_KEY',
    apiKey: () => process.env.OPENAI_API_KEY,
    model: () => process.env.LLM_MODEL || 'gpt-4o-mini',
  },
  deepinfra: {
    url: 'https://api.deepinfra.com/v1/openai/chat/completions',
    keyEnv: 'DEEPINFRA_UBIK30_KEY',
    apiKey: () => process.env.DEEPINFRA_UBIK30_KEY,
    model: () => process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-V3',
  },
};

function currentProvider() {
  const name = process.env.LLM_PROVIDER || 'openai';
  const cfg = PROVIDERS[name];
  if (!cfg) throw new Error(`Unknown LLM_PROVIDER '${name}' -- expected one of: ${Object.keys(PROVIDERS).join(', ')}`);
  return { name, ...cfg };
}

/** Sends one prompt, returns the raw text response. Both providers speak
 *  the OpenAI chat-completions shape (DeepInfra is OpenAI-compatible), so
 *  swapping providers is just a different url/key/model, not a different
 *  request shape. */
export async function chatComplete(prompt, { maxTokens = 1500, temperature = 0.4 } = {}) {
  const provider = currentProvider();
  const apiKey = provider.apiKey();
  if (!apiKey) throw new Error(`${provider.keyEnv} is not set (LLM_PROVIDER='${provider.name}')`);

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: provider.model(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) throw new Error(`${provider.name} API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

/** Every caller here asks the model to return raw JSON with no fence --
 *  this is the one place that pulls the `{...}` out and parses it, so the
 *  "no JSON found" / "malformed JSON" error message is worded consistently
 *  everywhere instead of copy-pasted per file. */
export function parseJsonResponse(text, label = 'response') {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in the ${label} -- it came back unusable.`);
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`The ${label} came back as malformed JSON: ${err.message}`);
  }
}
