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

Admin/approval app: `marketing.ubik360.com` (separate Vercel project, `hub/` in this repo).
Backend: Vercel serverless functions under `api/growth/` in *this* repo (not a separate server —
volume is far too low to justify an always-on process the way 360PrintStudio's DigitalOcean
backend is).

## Build status (updated 2026-09-22, evening)

| Piece | State |
|---|---|
| Supabase project | **live** — `ubik360-growth` (id `cwlffqbxgsyvduipuopl`, region ca-central-1), created by Jose directly (the MCP `create_project` call hit a harness-level "Modify Shared Resources" permission gate — same gate blocked Vercel project creation, still unresolved for that side). |
| Database schema | **applied** — `001_init.sql`, `002_enable_rls.sql`, `003_fix_function_search_path.sql` all live. RLS enabled on all 12 tables with zero anon/authenticated policies (intentional — see below); the two plpgsql functions have `search_path` pinned. `get_advisors` security scan clean except the expected informational RLS-no-policy note. |
| Backend API (`api/growth/**`) | written: weekly-plan propose/approve/staged/stage-approve, oneoffs list/pull/edit/send, leads list/detail/update, flows CRUD/steps/enroll/run, deliverability, me, Brevo webhook. Not yet deployed (main `ubik360` Vercel project doesn't have the `GROWTH_*` env vars set yet) or tested end-to-end against the live database. |
| `prospectResearch.js` | written, mirrors `360printstudio`'s `prospectEmail.js` exactly (Claude + server-side `web_search`/`web_fetch`, same streaming/pause_turn handling) |
| Hub app (`hub/`) | written: sign-in (Supabase magic link), Dashboard, Apollo tab, Drafts tab, Leads tab, Flows tab. Builds clean. **Not deployed** — Vercel project creation is still blocked by the permission gate; Jose has step-by-step manual instructions to create it himself (same pattern as the Supabase project). |
| `vercel.json` crons | added to the main `ubik360` project: weekly Apollo propose (Fri 08:00 ET), daily oneoff pull (10:00 ET), daily flow runner (11:00 ET) |
| Brevo | not yet touched — `jose@`/`grow@` need adding as verified senders |

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

## What's needed before this can go live

1. **`ANTHROPIC_API_KEY`** — needs a *fresh* key for this project, not reused from
   360PrintStudio's `.env.local` (per the "keep secrets genuinely separate" decision).
2. **`APOLLO_API_KEY`** — Jose confirmed reusing the existing Apollo account/key is fine; still
   needs to be set as its own env var on the `ubik360` Vercel project (not read from
   360PrintStudio's file at runtime).
3. **`GROWTH_SUPABASE_SERVICE_ROLE_KEY`** — Jose copies this himself from the Supabase dashboard
   (`ubik360-growth` → Settings → API) straight into the Vercel env var, deliberately never
   passed through chat.
4. **Brevo**: add `jose@ubik360.com` and `grow@ubik360.com` as verified senders. May be automatic
   if ubik360.com's domain-level auth already covers any `@ubik360.com` address — needs checking
   once in Brevo's dashboard.
5. **New Vercel project** for `hub/` — blocked by the same permission gate as the Supabase
   project was; Jose has manual step-by-step instructions (project name `ubik360-growth-hub`,
   root directory `hub`, domain `marketing.ubik360.com`).
6. **`GROWTH_OWNER_EMAIL`**, **`CRON_SECRET`**, **`GROWTH_WEBHOOK_SECRET`**,
   **`GROWTH_SUPABASE_URL`**, **`GROWTH_SUPABASE_ANON_KEY`** — set on the main `ubik360` Vercel
   project (see `.env.example`; URL/anon key values are in this session's transcript already).
7. First-run: Jose signs in to the hub via Supabase magic link once, at the email set as
   `GROWTH_OWNER_EMAIL`.

**Nothing sends, deploys, or spends a credit until each of these is actually done and Jose
explicitly says go** — see memory `feedback-no-live-push-without-signoff`.

## Deliberate scope cuts vs. the 360PrintStudio reference (v1)

- No staff roles/invites — single owner only.
- No dedicated warm-up subdomain — volume (10/day) is low enough Jose judged the risk negligible;
  sending straight from `jose@`/`grow@ubik360.com`.
- No IMAP reply poller — 360PrintStudio's `manny@go.` reply detection isn't built here yet;
  replies are read manually for now. Add later if volume ever justifies it.
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
