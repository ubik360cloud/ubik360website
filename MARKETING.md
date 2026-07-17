# Ubik 360 — Marketing Context

> Companion to [CLAUDE.md](./CLAUDE.md) (site structure/dev conventions). This file is the
> canonical source for brand voice, positioning, audience, and the marketing backend plan.
> Wholly scoped to **ubik360.com** — a separate business from any of José's other ventures;
> nothing here shares infrastructure, code, or data with them. Keep this file and any AI
> content-generation prompts in sync — drift between them is how brand voice degrades over time.

---

## Positioning (revised 2026-07 — supersedes the earlier résumé-led framing below)

> **This section replaces the brand voice/positioning that shipped with the Astro migration.**
> The earlier version leaned on José's personal track record (numbers, entity counts, "I don't
> tell you what you want to hear") as the primary credibility mechanism. Jose has now redirected
> this toward an **outcomes-first, business-first** voice. A first draft of this section also
> included digital transformation/cloud migration/AI as an NA service line — **removed 2026-07**:
> Jose tested those services in the market last year and got zero leads/interest. Root cause:
> that demand exists mainly at larger corporations who default to established enterprise
> providers (NetSuite, SAP, Salesforce, Adecco for staffing) rather than an independent
> consultant — not a fit for Ubik 360's actual buyer. **Do not reintroduce digital
> transformation/cloud/AI/DevOps as a service line without Jose explicitly deciding to re-test
> it.**

**Positioning statement:** Ubik 360 helps growing, founder-led businesses execute their next
strategic move. In North America, that means **staff augmentation in Latin America (nearshoring),
fractional CMO leadership, and growth marketing** that measurably moves the business forward. In
Latin America and bilingual markets, that means **go-to-market strategy and market entry into
Canada and the U.S.** — and that market entry goes beyond corporate/legal structure to include
**local operations efficiency** once established, not just incorporation. In both cases, Ubik 360
is a strategic partner who understands the business problem first and guides execution — not a
vendor selling a service, and not a résumé selling a person.

**Brand voice summary:** Expert, credible, and practical. Calm and strategic rather than
hype-driven — confidence comes from clear thinking and sound process, not from volume or
personal biography. Business-first: every page, email, and post centers the visitor's situation
and outcome, not José's background. Bilingual-fluent and cross-border aware by default, not as a
special add-on. The voice a capable advisor uses with another business owner: direct about the
work, quiet about the ego.

**Competitive advantage:** Ubik 360 operates fluently across North American and Latin
American/bilingual business contexts — the same partner can staff and grow a NA business's
marketing function *and* run its LatAm hiring, while also guiding a LatAm company's structured
entry into Canada/the U.S., without a handoff between specialists. Proof lives in **client
outcomes, process, and case examples** (anonymized where needed — ask Jose for specifics per
engagement, businesses generally cannot be named), not in personal credentials.

**Reconciliation status (resolved 2026-07):** this positioning now lines up with the earlier
Audience/ICP work — NA = nearshoring/staff augmentation + fractional CMO/growth marketing
(matches the existing `en/nearshore-staffing.html` + `en/digital-marketing.html` page split);
LatAm = market entry into Canada/US + (newly explicit) local operations efficiency post-entry
(fits inside `es/expansion-internacional.html`, likely as an addition to its scope). **One open
question, not yet resolved:** the earlier Audience/ICP section frames NA growth marketing
specifically as "reach the Hispanic market" — this prompt's "Growth Marketing" is stated more
generally. Flagging for Jose to confirm in a follow-up: is Hispanic-market-reach still the
specific angle for `en/digital-marketing.html`, or has that broadened to general growth
marketing for any NA business? See Audience/ICP section below, which still reflects the
Hispanic-market-specific framing pending that answer.

---

## Brand & Messaging Guidelines (canonical)

> Single source of truth for ALL Ubik 360 marketing communication — blog, email, social,
> ads, site copy. Any AI content generator built for Ubik 360 must be prompted from this
> section, and this section must be updated first if positioning changes.

**Brand voice:** expert, credible, practical, and business-first. Clear, calm, and strategic —
never hype-driven. Confident without sounding arrogant: the confidence comes from precision and
sound process, not from self-promotion. Every piece of copy centers the client's outcome, not
José's résumé. Written so a founder or decision-maker reading it thinks *"this person understands
my business problem and can guide me"* — not *"this person has an impressive career."*

**Tone rules:**
- Lead with the client's situation or problem, not with José's background or track record.
- Prove capability through **client outcomes, process, and case examples** — ask Jose for
  specifics per claim; most examples can be described but businesses generally cannot be named,
  so write around that constraint (describe the situation/result, omit the identifying name)
  rather than inventing a placeholder client.
- "We" is the default voice for the work itself; avoid making José-the-person the subject of
  hero copy or section openers.
- Short, declarative sentences. Calm and precise beats energetic or promotional.
- Bilingual (EN/ES) — translate voice, not just words. The calm/strategic register should hold in
  both languages; don't let Spanish copy drift warmer/more personal than the English by default,
  or vice versa, unless the messaging framework below calls for it.

**Approved tone words:** expert, credible, practical, clear, calm, strategic, precise, grounded,
structured, considered, trustworthy, capable, methodical, outcome-focused, cross-border,
bilingual-fluent.

**Banned tone patterns:**
- ❌ Hype-driven language: "game-changing," "revolutionary," "unlock your potential," "take your
  business to the next level," "in today's fast-paced world."
- ❌ Personal-bragging proof points (book counts, workout streaks, personal habits) **unless**
  there's a direct business reason and it reads naturally in context — default to omitting these.
- ❌ Résumé/CV-style credential lists as the lead argument for a page or section.
- ❌ José-as-subject in hero copy or opening lines — open with the client's situation instead.
- ❌ Vague superlatives without evidence ("the best," "unmatched") — if a claim can't be
  supported with a real outcome/process/example, cut it or soften it to something demonstrable.
- ❌ Urgency/pressure tactics, spammy CTAs, or generic agency-speak clichés.
- ❌ Job-application or personal-biography framing — this is a business-outcomes site, not a CV.

**Brand tokens** (from `src/styles/global.css` — keep any generated visual assets on-palette):
`--red: #931F1D` (CTAs) · `--black: #050505` (text) · `--green: #659157` (accents) ·
`--oak: #CEC5B5` (light backgrounds). Headings in DM Serif Display, body in Inter.

---

## Messaging Framework — North America vs. LatAm/Bilingual

**North America (English)**
- Core need: **staff augmentation in LatAm (nearshoring)**, **fractional CMO** leadership, and
  **growth marketing** that measurably moves the business forward. (Not digital
  transformation/cloud/AI — tested 2025, no market interest; that demand belongs to established
  enterprise providers like NetSuite/SAP/Salesforce/Adecco, not an independent consultant.)
- Buyer mindset: pragmatic and ROI-focused; wants a partner who can execute without hand-holding,
  not another vendor pitch.
- Message frame: the business needs marketing leadership and/or reliable LatAm staff without the
  cost/overhead of a full in-house build — Ubik 360 provides both as a working partner, not a
  one-off project vendor.
- Proof to lead with: process and outcomes (growth generated, roles filled and retained,
  efficiency gained from nearshore staffing) — described concretely, client names omitted where
  required.

**LatAm / Bilingual markets (Spanish)**
- Core need: expand into Canada/U.S. — go-to-market strategy, market entry, localization, and
  (explicitly, not just legal/corporate structure) **local operations efficiency** once
  established — structured cross-border growth support end-to-end, not just incorporation
  paperwork.
- Buyer mindset: ambitious but wary of unfamiliar regulatory/market terrain; wants a guide who
  has actually done this and can translate both language and business context.
- Message frame: expanding into Canada or the U.S. is a structured process, not a leap of faith —
  Ubik 360 provides the go-to-market plan, the local presence, the localization, and the
  operational efficiency that makes the move work long-term, not just on paper.
- Proof to lead with: the same standard — process, outcomes, case examples — not personal
  biography, even though the cross-border credibility is part of what makes the guidance
  trustworthy; keep that credibility implicit in the quality of the process, not stated as a
  personal résumé claim.

---

## Audience / ICP — and why EN/ES are NOT translations of each other

**Critical correction (2026-07, Jose):** `/en/` and `/es/` are two different offers to two
different audiences on opposite sides of the same border — not a bilingual mirror of one offer.
The site currently violates this (`es/marketing-digital.html` pitches "reach the Hispanic market
in the U.S./Canada" to a Spanish-reading Colombian visitor — the wrong offer for that audience).
**Any future page, blog post, or email must be written FOR its audience's actual direction, then
translated for tone/idiom only if the same content genuinely applies to both — never assume a
1:1 page mirror is correct by default.**

**ES visitor = Colombia/LatAm business owner, going outward (CO → U.S./Canada).** Real pain:
- Legally incorporating and operating in the U.S. or Canada.
- Local logistics and administrative partnerships once there (someone on the ground).
- Marketing strategy for the *new* market they're entering (not their home market).
- Event/trade show planning in the destination country.
→ This is expansion-outward + market-entry marketing, sold as one journey — not a translated
digital-marketing service page.

**EN visitor = U.S./Canada business owner, reaching inward.** Real pain:
- Reliable overseas/nearshore staff (Colombia/LatAm) without full-time-hire overhead.
- Marketing to reach the Hispanic market that's already local to them.
- Sourcing vendors/manufacturing partners in LatAm.
→ Nearshoring + Hispanic-market marketing + sourcing, sold as one journey. The existing
`en/digital-marketing.html` lead magnet ("Hispanic Market Accelerator... for Home Service
Businesses") is already aligned with this — it targets businesses wanting to *reach* the
Hispanic market, not Hispanic-owned businesses themselves. Keep that framing; don't regress it.

**Implication for "Track A / Track B" labels:** the old model (Track A = digital marketing,
Track B = international expansion, each mirrored EN/ES) should be replaced by an
audience-first structure. See "Proposed page architecture" below.

---

## Proposed page architecture (finalized 2026-07 — pending final HTML rewrite)

Replaces the current "same slugs, translated" structure. **Decided:** nearshoring/sourcing gets
its own dedicated EN page (primary draw for that audience, deserves its own SEO target + lead
magnet, not a buried section).

**ES site (audience: Colombia/LatAm business owner, expanding CO → U.S./Canada)**

| Page | Role | Content |
|---|---|---|
| `es/index.html` | Homepage | Hero reframed around going outward: entity formation, local partner on the ground, market-entry marketing, events/trade shows — not a translated version of the EN homepage. |
| `es/expansion-internacional.html` | **Main/only ES service page** | Entity formation, registered agent, banking, local logistics/admin partnership, **+ NEW: marketing strategy for the destination market** (absorbs what `marketing-digital.html` covered, reframed as "once you're in, how you market there" — not a standalone digital-marketing service), **+ NEW: event/trade show planning in the destination country.** |
| `es/marketing-digital.html` | **Retired as a standalone page** | Content merges into `expansion-internacional.html` as a section (e.g. `#marketing-en-tu-nuevo-mercado`). Needs a 301 redirect (`.htaccess`) since the URL is likely already indexed — see Technical implications below. |
| `es/sobre-mi.html`, `es/contacto.html` | Shared/neutral | Stay close translations — bio and contact aren't audience-direction-specific. |

**EN site (audience: U.S./Canada business owner, reaching inward)**

| Page | Role | Content |
|---|---|---|
| `en/index.html` | Homepage | Hero splits between the two real EN offers: reach the Hispanic market (marketing) and get overseas staff/sourcing (nearshoring) — replaces the current Track-A/Track-B split. |
| `en/digital-marketing.html` | Keep, mostly as-is | Already aligned with the audience model (Hispanic-market reach, not Hispanic-owned-business marketing). Gets the content-quality pass below regardless. |
| `en/nearshore-staffing.html` | **New dedicated page** | Pulled from `international-expansion.html`'s current "Nearshore Staffing" + "Supplier & 3PL Selection" sections: customer service/bookkeeping/back-office/appointment-setter staffing in Colombia, + LatAm vendor/manufacturing sourcing. Own lead magnet (e.g. a cost-comparison download, reusing the existing "Administrative Scale-Up" asset). |
| `en/international-expansion.html` | Narrows scope | Keeps only the secondary EN use case: U.S./Canada businesses wanting an actual entity/operating presence *in* Colombia (market entry consulting, on-the-ground ops manager, accounting network). Drops the Colombia→US/CA half entirely — that's the ES audience's page, not this one's. |
| `en/about.html`, `en/contact.html` | Shared/neutral | Unchanged. |

**Technical implications (for whoever implements — dev-conventions detail, not marketing):**
- `hreflang` alternate tags between EN/ES page pairs currently assert the pages are translations
  of each other — once content diverges, remove those cross-language `hreflang` links (they'd be
  actively wrong) or repoint them only where a page genuinely stays 1:1 (about/contact).
- `es/marketing-digital.html` needs a 301 → `es/expansion-internacional.html#marketing-en-tu-nuevo-mercado`
  in `.htaccess` once retired, to preserve any existing SEO value / indexed links.
- `includes/nav.js` link arrays need updating for both languages (ES drops the "Marketing
  Digital" nav item; EN gains "Nearshore Staffing"). The EN/ES toggle link itself already just
  points at the other language's homepage (`${alt}index.html`), not a per-page equivalent — no
  change needed there, and it conveniently avoids a broken-link problem now that pages diverge.
- `sitemap.xml` needs the new/retired URLs reflected.

---

## Content quality pass — findings (2026-07, before any rewrite)

Independent of the audience-architecture fix above, the existing EN copy (both service pages)
leans too heavily on José-centric framing — credentials and personal story presented before the
visitor's problem, e.g. hero copy that opens with credential stats rather than the reader's
situation. Fix direction for the rewrite (both new audience-specific pages):
- **Open with the visitor's problem/question**, not José's track record. Credentials support the
  answer; they shouldn't BE the opening pitch.
- **FAQ/concern-card sections already do this well** (`en/international-expansion.html`'s
  "The questions I get most" pattern) — extend that pattern earlier in the page, not just lower
  down. It's the strongest user-centered writing already on the site.
- Numbers/stats stay (they're real and are the credibility differentiator per the Brand
  Guidelines above) — but reposition them as proof *after* the pain point is named, not as the
  lead.

---

## Marketing Backend — Plan

**Status: not yet built.** The site today is fully static HTML with no backend, no CMS, no
lead capture beyond Calendly links and the chat widget (`ubik360-bot-production.up.railway.app`,
external to this repo).

**Decision: standalone backend, wholly scoped to Ubik 360.** New lean service — its own repo
(likely `ubik360cloud/ubik360-backend` or similar, TBD when created), own database, own
deploys. Not shared with any other business.

**Site stack decision (2026-07, Jose): migrate the main site from plain static HTML to Astro,
deployed on Vercel.** Driven by concrete issues found in a full content/code review — see
CLAUDE.md for the technical rationale (Tailwind-CDN performance cost, JS-injected nav/footer
causing layout shift and hurting crawlability, hand-maintained sitemap, duplicated inline CSS
per page) — all of which also blocked the goals below. The EN/ES audience-split rewrite (see
page architecture above) happens **directly in Astro**, not twice.

**Proposed stack** (mirrors a proven pattern from prior work, adapted — not shared code):
- **Site:** Astro (static output) on Vercel. File-based routing gives `/en/` and `/es/` as
  independent route trees — no forced translation pairing, matching the audience model. Real
  Tailwind build (purged/compiled), real Nav/Footer components (no client-side injection flash),
  `@astrojs/sitemap` for an always-current sitemap.
- **Backend (Phase 2+, separate from the site):** Node/Express (or similar lightweight API),
  deployed on DigitalOcean App Platform or Vercel serverless functions — pick based on where the
  rest of Ubik 360 infra lands.
- **Database:** Supabase Postgres — admin-key-gated `/admin/*` routes, public read-only where needed.
- **Blog:** Astro content collections under `ubik360.com/blog/` (folder route, not a subdomain —
  Jose's preference), generated by an AI tool (Claude) as Markdown/MDX with frontmatter and
  committed straight into this repo. Brand-voice-prompted from this file's guidelines section,
  with cover + in-article images and a **syndication kit**: per-post AI-drafted copy for
  LinkedIn (post + first comment), Medium.com (subtitle, tags, canonical import link), and social
  captions — one generation pass, copy-paste distribution. **Bilingual posts follow the audience
  model above** — a post isn't auto-translated EN↔ES; it's written for whichever audience it's
  actually for, with an ES/EN counterpart only when the topic genuinely serves both audiences.
- **Email marketing:** own contact/segment/campaign tool (not a third-party SaaS UI) — AI-assisted
  drafting from the brand guidelines above, warm-up sending discipline, engagement tracking.
- **Lead generation:** Apify-based scrape → verify → promote pipeline. Track A = local business
  discovery (Google Maps scraper, Hispanic-business-relevant search terms + geography). Track B =
  company/LinkedIn-style discovery for expansion-minded businesses, likely needing an
  email-finder step since LinkedIn rarely exposes emails directly. Every scrape run cost-capped.

**Build order (per priority decision):**
1. **Phase 1 — AI blog + syndication kit.** Highest leverage for a thought-leadership personal
   brand; content compounds SEO/authority and feeds every other channel once live.
2. **Phase 2 — Email marketing tool.** Own contacts/segments/campaigns once there's content worth
   sending and a place to send people.
3. **Phase 3 — Apify lead-gen pipeline.** Fill the pipeline for both tracks once there's a nurture
   path (email) ready to receive new leads.

**Budget target: ~$50–100/mo** for the full stack (hosting + Claude API usage + Apify credits +
email sending + any lightweight image generation). Revisit if a phase needs more (e.g. paid image
generation, a higher email sending tier, Apollo.io for Track B corporate lead-gen).

---

## Open questions / decisions pending

- Exact repo/hosting home for the new backend (own repo vs. folder in `ubik360website`) — lean
  toward a separate repo once Phase 1 scoping starts, to keep the static site simple.
- **Decided:** blog lives at `ubik360.com/blog/` (folder in this repo), not a subdomain.
- Finalize the page architecture table above (slugs, whether nearshoring/sourcing gets its own
  EN page) before rewriting `digital-marketing.html`/`international-expansion.html`/
  `marketing-digital.html`/`expansion-internacional.html`.
- Whether paid engagements (e.g. a bookable "Market Entry Checklist" or productized package) ever
  need payment processing — out of scope until asked for.

---

## Known content assets already on the site (for the blog/email tool to draw context from)

- `assets/downloads/*.html` — existing lead-magnet pages (USA incorporation checklist, Hispanic
  market accelerator, admin scale-up, lead-generation-by-proximity, a CEO/university report).
  These are a ready source of topics and existing positioning to stay consistent with.
- `en/about.html` / `es/sobre-mi.html` — the fullest expression of brand voice on the site today;
  use as the canonical voice reference alongside this file's guidelines section.
