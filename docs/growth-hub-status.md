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
| Email sending | **switched from Brevo to SendGrid 2026-09-30** (Jose: repeated Brevo friction) — see the dedicated section below for full detail and what's still needed before it can send. |

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

## Flow language + compact Apollo view (added 2026-09-24, later same day)

- **Flow email content follows the segment's geography, not the track.** `flowAssistant.js`
  detects Spanish-speaking LatAm countries (Colombia, Mexico, Argentina, etc.) from the plan's
  `organization_locations`/`person_locations` and drafts `subject`/`body` in Latin American Spanish
  for those, English otherwise -- `b2b` covers both Colombia and US/Canada, so this can't be a
  per-track constant. The flow's `name`/`description` (Jose's own admin-facing labels, never sent)
  stay in English regardless, so the Flows list stays consistently scannable.
- **Apollo tab no longer shows every completed plan as a full card.** A plan that's already been
  decided (imported/rejected) doesn't need its full rationale/brief/filter-toggle/staged-table
  repeated -- it's now one row (segment, contact count, created date, draft-flow button) in a
  paginated table (`GET /weekly-plan/list` gained `status` filtering + real `page`/`page_size`
  pagination with an exact count). Only plans still needing a decision (`proposed`/`approved`/
  `pulling`/`staged`) get the full card now.

## Enrollment idempotency fix + enroll-into-existing-flow (2026-09-25)

`enrollContact`'s upsert used to always reset `current_step` to 0 and `next_send_at` to now on a
conflict -- calling it twice for the same `(flow_id, contact_id)` (e.g. re-running "Enroll
segment") would silently restart an already-progressed or already-completed contact from step 1
and re-send what they'd already gotten. Now checks for an existing enrollment first and skips
rather than resets (`insert`, not `upsert`).

Answers "how do I add more contacts to the same campaign without a duplicate flow": each Apollo
pull is its own segment/plan (`source_plan_id`), but any number of segments can feed one flow. The
Apollo tab's completed-segments table has an "Enroll into existing flow" dropdown (lists that
track's `active` flows) next to "Draft flow" -- `enrollSegment` only ever touches contacts tagged
with the ONE plan id you call it with, so routing a new segment into an existing flow never
re-touches contacts an earlier segment already enrolled.

**Reminder for next session: Brevo sender verification for `jose@`/`grow@ubik360.com` is still
unconfirmed** (see "What's left" below) -- couldn't check it directly (no access to the decrypted
`BREVO_API_KEY`), so before assuming the daily cron will actually deliver anything once a flow gets
real enrollments, verify in Brevo's dashboard (Senders & Domains) or ask Jose to confirm.

## Send-test-to-self (2026-09-25)

Jose asked whether he could see an approved draft as it would actually land in a mailbox, and
whether a signature gets added automatically -- neither existed. `POST /flows/:id/test-send`
(`sendTestEmail()` in `_lib/flowEngine.js`) sends one step to an arbitrary address (his own inbox
by default, via `GROWTH_OWNER_EMAIL`), reusing the exact same `buildStepBody()` path (CTA
placement) and real `sendEmail`/`ensureOptOut` footer a contact would get -- subject gets a
"[TEST] " prefix. Flows step editor has a "Send test to me" button per step (saves current edits
first, so it reflects what's on screen). **CTA URL is just a plain appended line, no styled
button; no signature is added automatically beyond the opt-out footer** -- noted directly in the
UI now. Not tested by Claude Code itself (a real Brevo send, even a labeled test, is Jose's action
to trigger, not something to do on his behalf) -- verify it works when he tries it.

## LLM provider switched to OpenAI (2026-09-28)

Jose: "the quality of the email messages is very bad." Extracted a shared `_lib/llm.js` funnel
(`chatComplete` + `parseJsonResponse`) used by `filterAssistant.js`, `flowAssistant.js`, and
`prospectResearch.js` -- second provider switch (Anthropic → DeepInfra → OpenAI), so the next one
is a one-file change. `LLM_PROVIDER` (default `openai`) + `LLM_MODEL` (default `gpt-4o-mini`)
control it. **Requires `OPENAI_API_KEY` to be set** -- none of these three features work without
it (no silent fallback to DeepInfra, deliberately, so a missing key fails loudly instead of
quietly serving the old low-quality model). `DEEPINFRA_UBIK30_KEY` stays in place for image/video
generation only, unaffected.

**`OPENAI_API_KEY` added 2026-09-28, verified working** -- tested `suggest-flow` for all three
existing segments (Canada b2b, Colombia, Canada ic) post-redeploy, real gpt-4o-mini content came
back correctly (English/Spanish per geography, CTA on the right step only, no self-signature).
Regenerated and saved fresh steps into all three existing flows (`5900101b...`, `0d753da7...`,
`a132955c...`) -- noticeably better prose than the DeepSeek-V3 drafts. **The Canada b2b flow's 5
live enrollments will get this new content on their next send, not the old copy** -- nothing was
re-enrolled or re-sent, just the step content in place.

## Real gap found 2026-09-28: the daily send cron may not actually be running

While investigating a "reset the drafts" request, found: the Canada b2b flow's 5 enrollments
(created 2026-09-25 19:34 UTC, `next_send_at` already in the past) are still `status: 'active'`,
`current_step: 0` -- never touched. `daily_send_log` has **zero rows ever** (the shared 10/day cap
has never been touched even once). `npx vercel crons ls` confirms all three crons ARE registered
and `enabled: true` on the current production deployment -- so this isn't a "cron not configured"
problem. `get_runtime_logs`/`get_runtime_errors` both timed out before finding a root cause.
Genuinely unresolved -- possible causes not yet ruled out: `CRON_SECRET` mismatch (Vercel signs
its own cron requests with whatever value is currently set; if it was set once and something
changed since, invocations would 401 before doing anything), or a real Hobby-plan cron reliability
issue. Jose confirmed via the dashboard (Settings → Cron Jobs) that the feature toggle is
"Enabled" and all three crons are registered with the right schedules -- rules out "disabled" or
"not registered," not "silently failing." **`npx vercel logs ubik360.com --since ...` returned "No
logs found" for every query tried, including ones scoped to just the last 30 minutes covering
requests known to have succeeded** -- that command appears unreliable for this project/plan, so
its "no logs" result should NOT be read as proof the cron never fired; it's inconclusive, not
confirmed. **The one reliable next step: click "View Logs" on the `/api/growth/flows/run` row in
the dashboard's Cron Jobs tab** -- that's a different, working view Jose can check directly; it
wasn't available through any MCP tool or CLI query tried this session.

## "Context for this flow" box on the Flows page (2026-09-28)

Jose: "I need to add a context box... so I can give you more details on how I want the flow to
look." Drafting was previously only possible from the Apollo tab at plan-creation time. Now:
`flowAssistant.js`'s `proposeFlow()` takes an optional free-text `instructions` (told to take
priority over the generic defaults where they conflict) and an optional `plan` (a flow with no
linked segment still drafts, just without segment-specific targeting). `POST /flows/:id/suggest`
wires this to any existing flow; the Flows page step editor has a context textarea + "Suggest
steps with AI" button that populates the editor for review -- nothing saves until "Save steps."

## Drafts page was empty -- same root cause as the cron question (2026-09-28)

Jose: "how does /drafts work? I have not seen anything there." Checked the database: zero rows
ever in `oneoffs`. The page is the 1:1 research/draft queue -- normally filled by a daily cron
(`oneoffs/pull`) that researches ~5 fresh leads per track (via `prospectResearch.js`, requires
`contact.company_domain` to fetch their site) and drafts a personalized email + fit verdict for
each. Confirmed real candidates exist and are ready (33 b2b + 13 ic leads, `stage='new'`, almost
all with `company_domain` set) -- the queue was empty purely because nothing had ever triggered
the producer, consistent with the still-unresolved cron question above. Added
`POST /oneoffs/pull-now` (owner-authed, same `dailyOneoffPull` function the cron calls, same
per-contact dedupe so re-clicking is safe) + a "Pull fresh leads now" button and an explanatory
empty state on the Drafts page, so this doesn't depend on the cron mystery being resolved first.

## Manual Apollo-export contact import (2026-09-29)

Jose: better filtering/segmentation directly in Apollo's own UI than through this pipeline for
now -- wants to export contacts there and still build flows for them. `_lib/manualImport.js`
creates a segment directly (an `apollo_weekly_plans` row, `status: 'completed'`,
`filter: {manual: true}`, no Apollo API call at all) or adds to an existing one (idempotent on
`track`+`week_of`+`label`, same pattern as `proposeCustomPlan`), then upserts each row into
`contacts` (`source: 'manual_import'`) + `leads`, tagged with `source_plan_id` so it shows up in
the Apollo tab's completed-segments table with the same "Draft flow"/"Enroll into existing flow"
actions any other segment gets. `POST /weekly-plan/manual-import`, verified end-to-end against
production. `hub/src/lib/csv.js` is a small hand-written CSV parser + Apollo-export column-alias
mapper (Email required; name/title/company/domain/city/state/country/LinkedIn auto-detected) --
new "+ Import contacts from Apollo export" form on the Apollo tab shows a preview (row count,
unmapped columns, first 5 rows) before importing. No credits spent, no Apollo API call at any
point in this path.

## Email personalization + language-aware footer (2026-09-29)

Jose flagged a real Spanish send with three problems: no salutation despite Apollo giving us the
contact's real name, one solid block of text with no paragraph breaks, and an English unsubscribe
footer under a Spanish body. Proposed a revision, got approval with one correction ("My Signature
must be always in 3 lines: Jose M. Villegas / CEO Ubik 360 / Ubik360.com" -- not the prior
single-line format). Built:

- **`{{first_name}}` mail-merge token** for flow templates (one static body sent to a whole
  segment, so a real name can only be substituted at send time, not draft time).
  `flowEngine.js`'s new `personalize(text, firstName, placeholder)` swaps the token for a real
  first name; a contact with none on file gets the token AND its preceding space dropped (`"Hola
  {{first_name}},"` folds to `"Hola,"` instead of leaving a gap). `sendTestEmail` shows a literal
  `[First Name]`/`[Nombre]` placeholder instead, so a test send still demonstrates the token
  exists without pretending to know a name it doesn't have.
- **Real-name salutation for 1:1 drafts** (`prospectResearch.js`) since those are already
  per-contact -- the prompt now uses the prospect's actual first name directly, no token needed.
- **Paragraph structure**: both `flowAssistant.js`'s and `prospectResearch.js`'s prompts now
  explicitly require 2-4 short paragraphs instead of one block.
- **Language stored explicitly, not re-derived at send time**: new columns `flows.language` and
  `oneoffs.language` (migration `007_language.sql`, default `'en'`), set from the shared
  `_lib/language.js` geography detector when a draft is created, but editable afterward (a
  language `<select>` on the Flows page's flow-detail header, and on each Drafts card) --
  deliberately NOT re-computed from geography at send time, so hand-editing a draft into the other
  language can't produce a footer that contradicts the body.
- **Language-aware signature + opt-out**: `brevo.js`'s `SIGNATURE`/`OPT_OUT` are now `{en, es}`
  maps; `ensureSignature`/`ensureOptOut` take a `lang` param (default `'en'`) and **always append
  unconditionally** now -- the prior keyword-based dedup (skip if body already contains "Villegas"
  or "unsubscribe") was itself a bug: a manually-edited body containing "Jose Villegas, CEO"
  anywhere silently suppressed the real signature. Signature is the approved 3-line format:
  `Jose M. Villegas\nCEO Ubik 360\nUbik360.com`. `sendEmail({..., lang})` threads this through from
  both send paths: `flowEngine.js`'s `runDueSteps`/`sendTestEmail` pass `flow.language`,
  `oneoffs.js`'s `send` handler passes `draft.language`.
- Proactively fixed a latent double-signature bug this change would otherwise have introduced:
  `prospectResearch.js`'s prompt still said to sign the draft off itself, which combined with the
  new always-append signature would have produced two signatures. Removed that instruction from
  the prompt now that `sendEmail` always appends one.

## Switched from Brevo to SendGrid entirely (2026-09-30)

The account-activation 403 above was the last straw on top of the earlier sender-validation issue
that needed full domain authentication to fix -- Jose: "I always encounter these kind of problems
with Brevo... this is why 360PrintStudio uses Sendgrid." Decided to migrate **everything** off
Brevo, not just the Growth Hub's cold-outreach sends -- the newsletter/contact-form signup
integration (`api/subscribe.js`) moved too, even though it wasn't itself broken, per Jose's explicit
"everything off Brevo" call.

- **`api/growth/_lib/sendgrid.js`** replaces `_lib/brevo.js` (deleted) -- same exported shape
  (`sendEmail`, `ensureSignature`, `ensureOptOut`) so `flowEngine.js` and `oneoffs.js`'s `send`
  handler needed only an import-path change, no logic change. Uses SendGrid's `POST
  /v3/mail/send`; success is a 202 with an empty body (no JSON to parse, unlike Brevo's synchronous
  JSON response). Same 3-line signature, same language-aware opt-out footer, same `List-Unsubscribe`
  header -- none of the personalization work above needed to change.
- **`api/growth/_handlers/webhooks.js`**'s export renamed `brevo` → `sendgrid`, webhook shape
  changed to match: SendGrid's Event Webhook always POSTs a JSON **array** of events per call
  (Brevo sent one event object per call) -- the handler now loops. Bounce classification also
  differs: SendGrid uses one `bounce` event type with a `type` field (`"bounce"` = hard,
  `"blocked"` = soft) instead of Brevo's separate `hard_bounce`/`soft_bounce` event names,
  and adds a `dropped` event Brevo didn't have (mapped to `bounced` but never auto-suppressing,
  same as a soft bounce -- a drop is often itself caused by an existing suppression, not a new
  reason to add one). `handler.js`'s route moved from `webhooks/brevo` to `webhooks/sendgrid`.
- **`api/subscribe.js`** now calls SendGrid's Marketing Contacts `PUT /v3/marketing/contacts`
  instead of Brevo's `POST /v3/contacts`. One real behavior change: this endpoint is
  **asynchronous** (a 202 means the upsert job was accepted, not confirmed done) -- treated as
  success, which is good enough here. Also dropped the `LANG` contact attribute the Brevo version
  stored: SendGrid custom fields need to be created in the dashboard first to get a field id to
  reference, not worth the extra setup for one attribute at this scale. List membership alone still
  separates newsletter vs. contact-form signups.
- Env vars: `SENDGRID_API_KEY` (shared by both the Growth Hub sends and the newsletter signup --
  one key, one SendGrid account), `SENDGRID_LIST_NEWSLETTER`/`SENDGRID_LIST_CONTACT` (the actual
  list UUIDs from SendGrid's Marketing > Contacts > Lists UI -- unlike Brevo's simple numeric ids
  2/3, there's no sensible hardcoded default since the lists don't exist yet). `GROWTH_WEBHOOK_SECRET`
  is reused as-is for the new webhook URL.

**Completed and verified live, 2026-10-02.** Jose created the SendGrid account, filled out domain
authentication for `ubik360.com` (automated security, branded links with auto-provisioned SSL --
chose Hostinger as DNS host), and pasted the 7 resulting DNS records. All 7 were added at Hostinger
and verified resolving via `nslookup ... 8.8.8.8`; SendGrid's own `/v3/whitelabel/domains` API
confirmed `"valid": true` for the mail CNAME and both DKIM records. One important catch during
setup: SendGrid's domain-auth wizard also displayed the **existing** `_dmarc.ubik360.com` TXT
record (still pointed at `rua@dmarc.brevo.com`) as if it were part of the new record set -- it
wasn't a new record to add, just a reference display of the current one. Adding a second DMARC
record would have broken DMARC entirely (same class of mistake caught and fixed during the original
Brevo setup) -- flagged and skipped.

Two Marketing Contacts lists created via direct API calls (`POST /v3/marketing/lists`) rather than
asking Jose to hunt down UUIDs manually: "Ubik360 Newsletter" and "Ubik360 Contact Form Leads".
`SENDGRID_API_KEY`, `SENDGRID_LIST_NEWSLETTER`, `SENDGRID_LIST_CONTACT` staged on Vercel (writing
these required explicit confirmation -- Auto Mode blocks secret-store writes by default). Verified
with a raw test send (202, confirmed landed in Jose's inbox) before pushing.

**Code pushed and deployed 2026-10-02** (commit `1316db4`). Live verification after deploy:
- `POST /api/subscribe` against production actually upserted a test contact into the SendGrid
  "Newsletter" list (confirmed via `/v3/marketing/contacts/search`, not just a 200 response --
  the upsert endpoint is async, a bare 202/200 isn't proof by itself). Test contacts cleaned up
  after.
- `POST /api/growth/flows/:id/test-send` against the (Spanish-language, see the personalization
  section above) Colombia flow succeeded for real, landing in Jose's inbox via the exact same
  `sendEmail()` funnel the 1:1 draft send path also calls -- one successful test covers both send
  paths since they share the same underlying function.

**Not yet done:** the SendGrid Event Webhook itself isn't configured in SendGrid's dashboard yet
(`Settings -> Mail Settings -> Event Webhook`, pointed at
`https://ubik360.com/api/growth/webhooks/sendgrid?secret=<GROWTH_WEBHOOK_SECRET>`) -- sends work
without it, this only affects bounce/complaint/unsubscribe auto-suppression. Also: click/open
tracking should be turned off in SendGrid's Tracking settings to preserve the plain-bare-URL design
(not yet confirmed done). The old `BREVO_API_KEY` env var on Vercel hasn't been removed -- harmless
to leave since no code references it anymore, but worth deleting once everything's confirmed stable
for a few days.

## 1:1 drafting rewrite: Apollo firmographics, no website fetch, service-pitch picker (2026-10-02 to 10-06)

Jose: every 1:1 draft opened "I noticed that [company] does X" -- reads fake, and states the
obvious back to someone who knows their own business. Also pointed out Apollo already gives us
name, role, company, headcount, founding year, location and industry, so no per-prospect research
is needed (and it saves tokens).

- **`prospectResearch.js` no longer fetches anything.** The plain-HTTP website fetch and the page
  text in the prompt are gone. The prompt gets a flat structured-facts block (contact name/title,
  company, industry, size, founded year, country) and is told to reason from industry + size ("a
  company of this size in this industry commonly faces X"), be upfront that specifics get worked
  out together, and never open by restating what the company does. Verdict JSON dropped
  `findings`/`sources_read`; `decisive_signal` is now a structured fact.
- **Data:** migration `008_firmographics.sql` adds `contacts.company_size/industry/founded_year`.
  Apollo's match payload already had these (`apollo_staging.payload->organization`) but they were
  dropped at the contacts insert; `stageApprove`, `manualImport.js` and `hub/src/lib/csv.js`
  (Apollo export column aliases) now keep them, and 47 existing contacts were backfilled from
  staging payloads. Manually imported contacts only have them if the CSV export included those
  columns. `oneoffQueue.js` no longer requires `company_domain`.
- **Bug caught in testing:** the first version of the rewrite left the contact's own name out of
  the facts block, so every draft greeted "Hola,". Fixed (1e05cc0). Lesson: test-draft real
  contacts after any prompt rewrite, don't assume.
- **Wrong-angle bug (DISTRIMOTOS, a Colombian motorcycle-parts manufacturer, got a growth-marketing
  pitch).** Two causes in `positioning/b2b.md`: option 1 is scoped to NA businesses but nothing
  stopped it being picked for Colombia, and option 5 (manufacturing ops tooling) still required
  "research surfaced a real pain point", which can never be true now. Fixed with an explicit
  "Angle selection" gate section (Colombia + manufacturing -> option 5; prospect is itself an agency
  -> agency_subcontracting) and option 5 reworded around legacy-systems integration, process
  automation and cross-department data analysis. `ic.md`'s "best fit" criteria were likewise
  rewritten from observed-website signals to industry/size heuristics.
- **Service-pitch picker:** `POST /oneoffs/:id/redraft {business_unit}` re-drafts a not-yet-sent
  draft with the angle forced (`research({forcedBusinessUnit})`); a previously auto-skipped draft
  goes back to pending. Each Drafts card has a "Service pitch" dropdown + "Redraft with this angle"
  button (warns before discarding unsaved edits). Angle lists live in two places that must stay in
  sync: `VALID_BUSINESS_UNITS` in `_handlers/oneoffs.js` and `ANGLES` in `hub/src/pages/Drafts.jsx`.
- **Known limits:** the draft's quality depends on Apollo's industry tagging (CASTEM, an
  investment-casting manufacturer, came back as "mining & metals"). Draft output doesn't yet name
  the specific departments (logistics, production, sales, marketing, accounting) Jose's own sample
  email listed -- worth adding to option 5's brief. The "learn from my edits" feature (few-shot
  examples from sent+edited drafts, needs `oneoffs.ai_original_body` captured at creation) was
  scoped but not built.

## Why no flow ever sent, and the sending model that replaced it (2026-10-06)

Jose: three flows active for a week, dashboard shows no flow emails. Cause: **Vercel Cron calls its
paths with HTTP GET**, but all three cron routes (`flows/run`, `oneoffs/pull`, `weekly-plan/propose`)
were POST-only -- 404s, and GET `/flows/run` was captured by GET `/flows/:id` (owner auth, 401).
So the daily flow runner, the daily 1:1 draft pull and the Friday Apollo proposal had **never run
on their own** since launch (earlier manual tests all used POST, which is why it looked fine).
Fixed by registering GET versions *before* `:id` in `handler.js`. Proof: `/flows/run` now answers
`Unauthorized` from the cron handler instead of "Missing bearer token" from the owner handler.

**New sending model** (`sendCap.js`, `flowEngine.js`): 100/day account-wide (SendGrid free tier),
1:1 drafts limited to 10/day of that. The flow runner fires once a day at **18:00 UTC (2PM ET)**
(`vercel.json`), takes whatever is left of the day's allowance after the morning's 1:1 sends, and
splits it evenly across active flows (`allocateQuota`: a flow with few due contacts hands its unused
share to the others, e.g. 5 / 18 / 437 due with 100 available -> 5 / 18 / 77). Batched queries,
5-way concurrency, 45s time budget (function maxDuration 60s); anything not reached stays due for
the next run. Consequence of the 2PM design: 1:1 sends after the run only get what's left.
`GROWTH_DAILY_TOTAL_CAP` (Vercel env) is set to **30** as a deliberate warm-up for a brand-new
SendGrid account/domain sending cold email; raise toward 100 once bounces/complaints look clean
(the old `GROWTH_DAILY_SEND_CAP` is no longer read). `POST /flows/run-preview` (owner auth) shows
what the next run would send per flow without sending anything.

**Other fixes in the same batch:**
1. Language: a segment's language now comes from its contacts' countries (majority), not Apollo
   filter text -- a manual import's filter is `{manual:true}`, which had flipped the Colombian flow
   back to English. Per contact, `enrollContact` refuses (and the runner stops at send time) anyone
   whose own country implies the other language. Apollo's country is where the *person* lives, so
   the 437-contact Colombian segment actually held 32 US, 3 France, 1 each Spain/UAE/Brazil -- those
   38 enrollments were stopped (reversible: set back to `active`, or enroll them in an English
   flow). The Flows page shows the Spanish/English contact mix and warns on a mismatch.
2. Drafts: amber banner when a 1:1 contact is already in a flow or was emailed by one
   (`flow_history` on `GET /oneoffs`), repeated in the send confirmation.
3. Apollo tab: removed "Enroll into existing flow"; the Flows tab has "Enroll another segment into
   this flow" instead.
4. SendGrid event webhook enabled via API (delivered/bounce/dropped/spam/unsubscribe) pointing at
   `/api/growth/webhooks/sendgrid?secret=...` with a freshly generated `GROWTH_WEBHOOK_SECRET` (also
   in gitignored `.env.local`); click and open tracking switched OFF in SendGrid (both were on,
   which rewrites links through a tracking redirect).
5. Dashboard: sent-today of the cap, 1:1 vs flow sends, contacts waiting in *running* flows.

**Flows paused for stale copy:** "Canada ecommerce brands - nearshore staffing" (18) and "Canada
ecommerce & agency staffing test" (5) predate the personalization work (no greeting / "Hello there" /
"I noticed your recent hiring activity..."); paused until redrafted. "Colombia marketing directors -
manufacturing" (0 enrolled) has Spanish copy and language now set to es, but an old-style opener.

## What's left before this can actually send anything

1. Add `GROWTH_ADMIN_SECRET` on Vercel (see above) so the two queued test pulls can actually run.
2. Configure the SendGrid Event Webhook in the dashboard (see above) for bounce/complaint tracking.
3. Confirm click/open tracking is off in SendGrid's Tracking settings.
4. First real end-to-end test: sign in to the hub, manually trigger a weekly Apollo plan (small
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
