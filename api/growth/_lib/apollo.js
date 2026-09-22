// Apollo API helper -- mirrors 360PrintStudio's apolloSync.js pattern:
// mixed_people/api_search is free and returns masked profiles (no email);
// people/bulk_match reveals the real record and costs 1 credit PER RECORD
// REQUESTED, whether or not it turns up an email. Only spend bulk_match
// credits on ids we don't already hold (checked by the caller).
const APOLLO_BASE = 'https://api.apollo.io/api/v1';

export async function apolloFetch(path, body) {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error('APOLLO_API_KEY is not set');
  const res = await fetch(APOLLO_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'x-api-key': key },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Apollo POST ${path} -> ${res.status}: ${json?.error || JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}
