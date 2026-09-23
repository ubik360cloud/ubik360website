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
(`ubik360-growth-hub`), live at `ubik360-growth-hub.vercel.app` today — `marketing.ubik360.com`
once its DNS record is added. Backend: a single catch-all Vercel serverless function,
`api/growth/[...path].js`, in *this* repo's main deployment (not a separate server — volume is
far too low to justify an always-on process the way 360PrintStudio's DigitalOcean backend is).

## Build status (updated 2026-09-22, night)

| Piece | State |
|---|---|
| Supabase project | **live** — `ubik360-growth` (id `cwlffqbxgsyvduipuopl`, region ca-central-1), created by Jose directly after Claude Code's own `create_project` MCP call hit a harness "Modify Shared Resources" permission gate. |
| Database schema | **applied** — `001_init.sql`, `002_enable_rls.sql`, `003_fix_function_search_path.sql`. RLS enabled on all 12 tables with zero anon/authenticated policies (intentional, see below); `search_path` pinned on both plpgsql functions. `get_advisors` clean except the expected informational RLS-no-policy note. |
| Backend API (`api/growth/**`) | **deployed and live** on the main `ubik360` Vercel project. Originally 19 separate route files — blew past Vercel Hobby's 12-functions-per-deployment cap on first real deploy (`errorCode: exceeded_serverless_functions_per_deployment`); consolidated into one catch-all function (`api/growth/[...path].js` + `_handlers/*.js` named exports + `_lib/*.js`) — same URL surface, no client-side change needed. |
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

**A fresh production deploy is still needed to pick up the three most-recently-added keys**
(env vars only apply to deployments created after they're added — same gotcha already documented
under "Newsletter (Brevo)" in CLAUDE.md).

## What's left before this can actually send anything

1. **Redeploy** the main `ubik360` project once more so it picks up
   `GROWTH_SUPABASE_SERVICE_ROLE_KEY` / `APOLLO_API_KEY` / `DEEPINFRA_UBIK30_KEY`.
2. **Brevo sender verification** for `jose@ubik360.com` and `grow@ubik360.com` — check Brevo's
   dashboard; may already be covered by ubik360.com's existing domain-level auth.
3. **`marketing.ubik360.com` DNS** — add the CNAME Vercel's domain-settings screen specifies for
   the `ubik360-growth-hub` project, at wherever ubik360.com's DNS is actually managed (Hostinger
   per CLAUDE.md's "Hosting / deployment" section).
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
