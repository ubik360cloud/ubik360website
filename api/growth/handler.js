// Single catch-all serverless function for the entire Growth Hub API.
// Vercel's Hobby plan caps a deployment at 12 serverless functions total;
// the original one-file-per-route layout (19 routes) blew past that the
// first time this deployed (errorCode: exceeded_serverless_functions_per_deployment).
// Consolidated here -- all real logic lives in ./_handlers/*.js (named
// exports, not routed since only files directly under /api become
// functions) and ./_lib/*.js; this file is just the dispatch table.
//
// Routing note (2026-09-22): this is a plain filename, not a
// `[...path].js` bracket file. Vercel's bracket-catch-all convention for
// zero-config Node functions only reliably matched a single path segment in
// practice here (confirmed live: multi-segment requests never even reached
// the function, single-segment ones did but with the query keyed
// '...path' literally, not the Next.js-normalized 'path'). An explicit
// rewrite in vercel.json (`/api/growth/:path* -> /api/growth/handler?path=:path*`)
// is what actually routes every depth here reliably -- see that file.
import * as weeklyPlan from './_handlers/weeklyPlan.js';
import * as oneoffs from './_handlers/oneoffs.js';
import * as leads from './_handlers/leads.js';
import * as flows from './_handlers/flows.js';
import * as misc from './_handlers/misc.js';
import { brevo } from './_handlers/webhooks.js';

// Route pattern segments: a string matches literally, `:id` captures into
// req.params.id. Order matters only in that more-specific patterns should
// come before less-specific ones of the same length (not an issue here --
// every pattern has a unique literal/dynamic shape).
const ROUTES = [
  { method: 'GET', pattern: ['weekly-plan', 'current'], handler: weeklyPlan.current },
  { method: 'GET', pattern: ['weekly-plan', 'list'], handler: weeklyPlan.list },
  { method: 'POST', pattern: ['weekly-plan', 'custom'], handler: weeklyPlan.custom },
  { method: 'POST', pattern: ['weekly-plan', 'preview'], handler: weeklyPlan.preview },
  { method: 'POST', pattern: ['weekly-plan', 'suggest-filter'], handler: weeklyPlan.suggestFilter },
  { method: 'POST', pattern: ['weekly-plan', 'propose'], handler: weeklyPlan.propose },
  { method: 'POST', pattern: ['weekly-plan', ':id', 'approve'], handler: weeklyPlan.approve },
  { method: 'POST', pattern: ['weekly-plan', ':id', 'suggest-flow'], handler: weeklyPlan.suggestFlow },
  { method: 'GET', pattern: ['weekly-plan', ':id', 'staged'], handler: weeklyPlan.staged },
  { method: 'POST', pattern: ['weekly-plan', ':id', 'stage-approve'], handler: weeklyPlan.stageApproveRoute },

  { method: 'GET', pattern: ['oneoffs'], handler: oneoffs.list },
  { method: 'POST', pattern: ['oneoffs', 'pull'], handler: oneoffs.pull },
  { method: 'PATCH', pattern: ['oneoffs', ':id'], handler: oneoffs.update },
  { method: 'POST', pattern: ['oneoffs', ':id', 'send'], handler: oneoffs.send },

  { method: 'GET', pattern: ['leads'], handler: leads.list },
  { method: 'GET', pattern: ['leads', ':id'], handler: leads.detail },
  { method: 'PATCH', pattern: ['leads', ':id'], handler: leads.detail },

  { method: 'GET', pattern: ['flows'], handler: flows.listCreate },
  { method: 'POST', pattern: ['flows'], handler: flows.listCreate },
  { method: 'POST', pattern: ['flows', 'run'], handler: flows.run },
  { method: 'GET', pattern: ['flows', ':id'], handler: flows.detail },
  { method: 'PATCH', pattern: ['flows', ':id'], handler: flows.detail },
  { method: 'PUT', pattern: ['flows', ':id', 'steps'], handler: flows.steps },
  { method: 'POST', pattern: ['flows', ':id', 'enroll'], handler: flows.enroll },
  { method: 'POST', pattern: ['flows', ':id', 'enroll-segment'], handler: flows.enrollSegmentRoute },

  { method: 'GET', pattern: ['deliverability'], handler: misc.deliverability },
  { method: 'GET', pattern: ['me'], handler: misc.me },

  { method: 'POST', pattern: ['webhooks', 'brevo'], handler: brevo },
];

function matchRoute(method, segments) {
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    if (route.pattern.length !== segments.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < route.pattern.length; i += 1) {
      const p = route.pattern[i];
      if (p.startsWith(':')) params[p.slice(1)] = segments[i];
      else if (p !== segments[i]) { ok = false; break; }
    }
    if (ok) return { handler: route.handler, params };
  }
  return null;
}

export default async function handler(req, res) {
  // OPTIONS preflight for any route -- individual handlers apply CORS via
  // withOwner, but a browser can preflight before we even know which route
  // it's hitting, and webhooks.brevo (no withOwner) never needs it (server-
  // to-server only), so handle the generic case here too.
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.GROWTH_HUB_ORIGIN || 'https://marketing.ubik360.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  // vercel.json's rewrite passes the full matched path as a single
  // slash-joined query string, e.g. path=weekly-plan/current -- split it
  // back into segments here.
  const raw = req.query.path;
  const joined = Array.isArray(raw) ? raw.join('/') : raw;
  const segments = (joined || '').split('/').filter(Boolean);
  const match = matchRoute(req.method, segments);
  if (!match) return res.status(404).json({ error: 'Not found' });

  req.params = match.params;
  return match.handler(req, res);
}
