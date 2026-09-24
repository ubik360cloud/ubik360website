# Growth Hub (Apollo outreach) — status

Built using 360PrintStudio's marketing-hub as an architectural reference (see that repo's
`EmailMarketing.md`, `docs/email-rebuild-status.md`, `apolloSync.js`, `oneoffQueue.js`,
`prospectEmail.js`) — same patterns, own codebase, own database, own domain. **Not shared
infrastructure with 360PrintStudio** — same Supabase account, separate project.

## What this is

Two outreach tracks sharing one system, capped at **10 sends/day combined** (Jose, 2026-09):
- **`ic`** — Jose's independent-contractor pitch, sent from `jose@ubik360.com`. Positioning:
  `api/growth/_lib/positioning/ic.md`.
- **`b2b`** — Ubik 360's own outreach selling its services, sent from `grow@ubik360.com`.
  Positioning: `api/growth/_lib/positioning/b2b.md`.

Admin/approval app: `hub/` in this repo, deployed as its own Vercel project
(`ubik360-growth-hub`), live at both `ubik360-growth-hub.vercel.app` and `marketing.ubik360.com`
(DNS added at Hostinger 2026-09-22 — a CNAME to `cname.vercel-dns.com`, replacing a conflicting
default Hostinger ALIAS record; cert issued via Vercel's API). Backend: a single Vercel serverless
function, `api/growth/handler.js`, routed via an explicit `vercel.json` rewrite
(`/api/growth/:path*` → `/api/growth/handler?path=:path*`) rather than the `[...path].js`
bracket-filename convention — see "Routing gotcha" below for why. Lives in *this* repo's main
deployment (not a separate server — volume is far too low to justify an always-on process the way
360PrintStudio's DigitalOcean backend is).

## Build status (updated 2026-09-22, night)

| Piece | State |
|---|---|
| Supabase project | **live** — `ubik360-growth` (id `cwlffqbxgsyvduipuopl`, region ca-central-1), created by Jose directly after Claude Code's own `create_project` MCP call hit a harness "Modify Shared Resources" permission gate. |
| Database schema | **applied** — `001_init.sql`, `002_enable_rls.sql`, `003_fix_function_search_path.sql`. RLS enabled on all 12 tables with zero anon/authenticated policies (intentional, see below); `search_path` pinned on both plpgsql functions. `get_advisors` clean except the expected informational RLS-no-policy note. |
| Backend API (`api/growth/**`) | **deployed and live**, all routes verified reachable. Two real deploy bugs, both fixed: (1) originally 19 separate route files blew past Vercel Hobby's 12-functions-per-deployment cap — consolidated into `_handlers/*.js` named exports + `_lib/*.js`; (2) the consolidated function was first named `api/growth/[...path].js` (Next.js-style catch-all) — Vercel's zero-config bracket detection for a non-Next.js app only matched a single path segment in practice (`/api/growth/me` worked, `/api/growth/weekly-plan/current` 404'd at the platform level, never reaching the function). Fixed by renaming to a plain `handler.js` and adding an explicit `vercel.json` rewrite instead of relying on bracket-filename magic. Same URL surface throughout — no client-side (`hub/`) change needed either time. |
| `prospectResearch.js` | **switched from Anthropic to DeepInfra 2026-09** (Jose, cost). Fetches the prospect's URL itself (plain HTTP, no AI, no extra paid search API) and hands the page text to a DeepInfra-hosted model (`PROSPECT_MODEL` env var, defaults to `deepseek-ai/DeepSeek-V3` — DeepInfra never auto-picks a model). Trade-off vs. the original Anthropic-native `web_search`/`web_fetch` tools: no more autonomous discovery of pages not explicitly given a URL. Key: `DEEPINFRA_UBIK30_KEY` (Jose's own naming, not a generic `DEEPINFRA_API_KEY`). |
| Hub app (`hub/`) | **deployed and live** at `ubik360-growth-hub.vercel.app`. Hit its own build failure first: `npm audit fix --force` had bumped `vite` to 8.3.0 locally, which `@vitejs/plugin-react@4.7.0` doesn't support -- local npm let it through with a warning, Vercel's strict `npm install` didn't. Pinned back to `vite@^7.1.12`. Sign-in (Supabase magic link) works end-to-end. |
| `vercel.json` crons | added to the main `ubik360` project: weekly Apollo propose (Fri 08:00 ET), daily oneoff pull (10:00 ET), daily flow runner (11:00 ET) |
| Brevo | not yet touched — `jose@`/`grow@ubik360.com` need adding as verified senders (or confirming ubik360.com's domain-level auth already covers them) |

## Row Level Security — why zero policies is correct here

Every table has RLS enabled with **no** policies for `anon`/`authenticated`. That's deliberate,
not incomplete: the hub app's Supabase anon key is only ever used for Supabase Auth (magic-link
sign-in) — it never queries these tables directly. All real data access goes through the backend
API (`api/growth/**`), authenticated via a bearer token and using the **service_role** key, which
bypasses RLS entirely. So "RLS on, no policies" correctly blocks the one realistic attack surface
(someone extracting the public anon key from the hub's JS bundle and querying Supabase directly)
without needing any policies written, since nothing legitimate uses that key for table access
anyway. Revisit only if a future feature makes the hub query Supabase directly instead of through
the API.

## Env vars — current state on the main `ubik360` Vercel project

All of these are **set** as of 2026-09-22 night: `GROWTH_SUPABASE_URL`, `GROWTH_SUPABASE_ANON_KEY`,
`GROWTH_SUPABASE_SERVICE_ROLE_KEY`, `GROWTH_HUB_ORIGIN`, `GROWTH_OWNER_EMAIL` (`jose@ubik360.com`),
`CRON_SECRET`, `GROWTH_WEBHOOK_SECRET`, `GROWTH_DAILY_SEND_CAP` (10), `APOLLO_API_KEY`,
`DEEPINFRA_UBIK30_KEY`. `PROSPECT_MODEL` is unset (fine — code default covers it). Note:
`GROWTH_SUPABASE_SERVICE_ROLE_KEY`/`APOLLO_API_KEY`/`DEEPINFRA_UBIK30_KEY` are scoped to
**Production only** (not Preview/Development) — fine for this project since it only ever deploys
to production from `astro-migration`, but worth knowing if a preview deploy ever needs them.

All required env vars are deployed and live as of the routing-fix redeploy (2026-09-22 night).

## Routing gotcha (fixed 2026-09-22 — don't reintroduce)

Vercel's `[...path].js` bracket-filename catch-all convention (the Next.js-style rest-parameter
pattern) does **not** reliably work for a plain, non-Next.js zero-config Node function. Confirmed
live: a single-segment request (`/api/growth/me`) reached the function but with the query keyed
literally `'...path'` (dots included) instead of the Next.js-normalized `'path'`; any
multi-segment request (`/api/growth/weekly-plan/current`) never reached the function at all —
Vercel's platform itself returned 404 before invoking anything. Fixed by renaming the file to a
plain `api/growth/handler.js` and adding an explicit rewrite in `vercel.json`:
`{ "source": "/api/growth/:path*", "destination": "/api/growth/handler?path=:path*" }`. The
handler splits `req.query.path` (a slash-joined string) back into segments itself. If a future
change needs another catch-all API route in this project, use this rewrite pattern, not a bracket
filename.

## Custom-labeled test plans (added 2026-09-23)

`apollo_weekly_plans` now allows multiple plans per `(track, week)` as long as they have distinct
`label`s (migration `004_custom_named_plans.sql`) — the standard automated weekly plan keeps
`label=''`; a manually-targeted test campaign gets a real label plus a free-text `brief` recording
the human reasoning behind its filter. `proposeCustomPlan()` in `_lib/weeklyPlan.js` creates one;
the existing `approve`/`staged`/`stage-approve` routes work on any plan id unchanged. The Apollo
search body is now built from the full documented `mixed_people/api_search` parameter set
(`APOLLO_SEARCH_KEYS` allowlist in `_lib/weeklyPlan.js`), not just the three fields the original
weekly-only version hardcoded — confirmed via `docs.apollo.io` that this endpoint has **no**
buying-intent/topic parameter; `q_organization_job_titles` + `organization_num_jobs_range` +
`organization_job_posted_at_range` ("actively hiring for X") is the closest real proxy (Jose
agreed this is fine, 2026-09-23). `hub/src/pages/Apollo.jsx` now lists every plan for a track
(`GET /weekly-plan/list`), not just the single latest one, so custom test campaigns show up as
their own cards alongside the standard weekly plan.

New route: `POST /weekly-plan/custom` (`{track, label, brief, filter, target}`) — owner-authed
like the rest of this file, but `_lib/auth.js`'s `requireOwner` now also accepts a static
`GROWTH_ADMIN_SECRET` bearer token at the same trust level as an owner session, so a one-off
admin-triggered plan (e.g. Claude Code setting up a specific geography/industry test) can be
created without a browser login. **`GROWTH_ADMIN_SECRET` is not yet set on Vercel** — writing a
new secret hit a hard "Secret-Store Writes" permission gate (same category as the earlier
"Credential Materialization" block, did not retry-succeed) — Jose needs to add it himself via the
Vercel dashboard before this route (or a Claude-Code-triggered test pull) works. See chat for the
generated value to paste in.

Two real test campaigns are queued behind that one manual step, both `b2b` track, target 10:
- **`canada-outsourcing-staffing-test`** — Canada, decision-maker titles, ecommerce brands +
  marketing/ad agencies (subcontractor angle), hiring-activity proxy filters.
- **`colombia-ai-automation-test`** — Colombia, decision-maker titles (EN+ES), manufacturing
  companies, hiring-activity proxy filters.

## Two real bugs found and fixed 2026-09-24 (don't reintroduce)

1. **`hub/` had no `vercel.json`** -- a Vite/React SPA using `BrowserRouter` needs a rewrite
   (`{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) so a direct hit or hard
   refresh on a client-side route (`/apollo`, `/leads`, ...) doesn't 404. It only ever worked when
   reached by clicking a nav link inside an already-loaded session -- looked like intermittent
   breakage until reproduced directly.
2. **`ubik360-growth-hub` doesn't auto-promote git deployments to Production** -- every push
   builds fine but lands as an un-aliased preview (`target: null`); the main `ubik360` project
   auto-promotes correctly, this one doesn't (a project-level Vercel Git setting, not something
   fixed in code). **After every push that touches `hub/`, manually promote the new deployment**
   (`create_deployment` with that `deploymentId` and `target: "production"` -- `request_promote`
   returned a 422 here, the redeploy-with-target approach is what actually works) or
   `marketing.ubik360.com` keeps serving stale code. This bit a real session: a rollback to a
   two-day-old commit sat live for a while and looked like "nothing works in the hub" when the
   backend was actually fine.

## Apollo filter lessons (2026-09-24 test campaigns)

- **Cost model**: `mixed_people/api_search` (search/filter) is always free, any page size, any
  volume. Only `people/bulk_match` (revealing a real email) costs 1 credit per record requested.
  The original pipeline coupled both into one "Approve" action; `previewSearch()` in
  `_lib/weeklyPlan.js` (`POST /weekly-plan/preview`) now does the free half alone, so real
  candidate volume can be checked before spending anything.
- **`organization_num_employees_ranges` accepts arbitrary custom ranges** as `"min,max"` strings
  (e.g. `"25,100"`), not just fixed presets -- confirmed against Apollo's docs.
- **A bare `person_titles: ["director"]` is too broad** -- Apollo matches it as a keyword/substring
  against the full title, so it pulls in every department's director (IT, production, PR, finance
  -- anything with "Director" in the string). Use compound titles ("marketing director", "director
  de ventas") when the intent is department-specific; bare titles are fine for department-agnostic
  ones (ceo, owner, president, founder).
- **The "actively hiring" proxy (`organization_num_jobs_range` + `organization_job_posted_at_range`
  + `q_organization_job_titles`) can cut volume by 90%+**, and how much depends heavily on
  Apollo's job-posting data density for that geography/industry. Colombia manufacturing at
  25-100 employees: 2 matches with the hiring filter on, 6,300 with it off. Canada
  ecommerce/agencies at the same size: 34 vs 2,674. Always check both with `previewSearch` before
  deciding whether "high-intent-only" is worth the volume cost for a given campaign -- don't assume
  the tradeoff is the same across geographies.
- **There is no separate "LinkedIn currently hiring" field** in Apollo's API -- the job-posting
  parameters above ARE the actual mechanism behind that signal, confirmed against docs.

## AI-assisted filter proposal (added 2026-09-24)

`_lib/filterAssistant.js` (`POST /weekly-plan/suggest-filter`, owner-authed) takes a free-text
brief (geography, industry, titles to include/exclude, anything Jose knows that a raw filter can't
capture) and returns a suggested `{label, rationale, target, filter}` via DeepInfra, grounded in
the track's positioning brief and a literal list of real Apollo filter field names (so it can't
invent a parameter). Wired into a new form on the hub's Apollo tab: Suggest → edit the JSON
directly or re-suggest with the edited filter as a starting point → Preview volume (free) → Create
plan. Nothing here spends Apollo credits until that plan's own Approve button is clicked, same as
any other plan. Built so Jose doesn't have to describe a target in chat each time and wait for a
hand-written filter -- see CLAUDE.md Growth Hub section.

## Segments -> AI-drafted flows -> bulk enroll (added 2026-09-24)

Closes the gap between the Apollo pipeline and the Flows sequencer that existed until now: an
imported contact only carried its track (`ic`/`b2b`), with no link back to which Apollo plan
actually sourced it, so a flow had no way to target "just this campaign." A plan (with its
label/brief/filter) already IS a natural segment definition -- migration `005_segments.sql` adds
`contacts.source_plan_id` (set at import time in `stageApprove`, backfilled for contacts imported
before this existed) and `flows.source_plan_id` (set when a flow is created from a segment).

- `_lib/flowAssistant.js` (`POST /weekly-plan/:id/suggest-flow`, owner-authed) drafts a flow's name
  + multi-step subject/body grounded in the segment's filter/brief/positioning, via DeepInfra (same
  pattern as `filterAssistant.js`). Pure suggestion, no DB write.
- Apollo tab: "Draft flow for this segment" button (shows once a plan has `counts.imported > 0`)
  calls the suggestion, creates the flow linked via `source_plan_id`, saves the steps, and hands
  off to the Flows page (`/flows?open=<id>`) to review/edit -- same approve-and-activate gate as
  any hand-written flow, nothing here sends anything.
- Flows page: shows the linked segment (label, brief, imported count) and a one-click "Enroll
  segment into this flow" button (`POST /flows/:id/enroll-segment`) instead of enrolling contacts
  one at a time. **Guarded (both in the UI and in `enrollSegment()`) to require the flow already be
  `active`** -- enrolling into a still-`draft` flow would hit `runDueSteps()`'s existing
  `flow.status !== 'active'` check on the enrollment's very first due date and mark it `completed`
  without ever sending, even after the flow activates later. Correct order: draft → edit → approve
  & activate → THEN enroll.
- `stageApprove` also auto-enrolls into `plan.flow_id`'s flow if one is already linked at import
  time (the reverse ordering -- a recurring segment whose flow already exists).
- Verified end-to-end against production: suggested a real flow for the
  `colombia-ai-automation-test-v3` segment (coherent 2-step draft), confirmed the flow detail
  response includes segment info, confirmed enroll-segment correctly rejects before activation.

## What's left before this can actually send anything

1. Add `GROWTH_ADMIN_SECRET` on Vercel (see above) so the two queued test pulls can actually run.
2. **Brevo sender verification** for `jose@ubik360.com` and `grow@ubik360.com` — check Brevo's
   dashboard; may already be covered by ubik360.com's existing domain-level auth.
3. First real end-to-end test: sign in to the hub, manually trigger a weekly Apollo plan (small
   target, ~20 contacts/track) and review what comes back before letting cron automate it.

**Nothing sends a real cold email or spends unreviewed Apollo credits without Jose explicitly
approving that specific action from the hub** — see memory `feedback-no-live-push-without-signoff`.

## Deliberate scope cuts vs. the 360PrintStudio reference (v1)

- No staff roles/invites — single owner only.
- No dedicated warm-up subdomain — volume (10/day) is low enough Jose judged the risk negligible;
  sending straight from `jose@`/`grow@ubik360.com`.
- No IMAP reply poller — 360PrintStudio's `manny@go.` reply detection isn't built here yet;
  replies are read manually for now. Add later if volume ever justifies it.
- No autonomous web search in research (see `prospectResearch.js` note above) — DeepInfra doesn't
  offer Anthropic's native web_search/web_fetch tools, and adding a separate search API was
  judged not worth it for a single-URL-per-prospect research step at this volume.
- Flow engine is simpler: no cold-lifetime cap, no cross-flow dedupe beyond one active enrollment
  per contact per flow. Add sophistication only if real usage needs it.
- Weekly Apollo pull target defaults to 20/track (not 600) — sized to feed a 10/day cap, not
  the higher-volume 360PrintStudio pattern it's based on.

## Open design note (not yet resolved)

`weeklyPlan.js`'s `stageApprove()` imports approved contacts into `contacts` + `leads` but does
**not** auto-enroll them into a flow (unlike the reference). The primary send path today is the
1:1 draft queue (`dailyOneoffPull` draws from `leads` where `source='apollo'`); flow enrollment is
a separate explicit action from the Flows tab once a flow exists and is activated. Revisit if
that split turns out to be the wrong default once real usage starts.
