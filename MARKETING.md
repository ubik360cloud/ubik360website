# Ubik 360 — Marketing Context

> Companion to [CLAUDE.md](./CLAUDE.md) (site structure/dev conventions). This file is the
> canonical source for brand voice, positioning, audience, and the marketing backend plan.
> Wholly scoped to **ubik360.com** — a separate business from any of José's other ventures;
> nothing here shares infrastructure, code, or data with them. Keep this file and any AI
> content-generation prompts in sync — drift between them is how brand voice degrades over time.

---

## Positioning

**One line:** Ubik 360 is José Villegas's personal consulting practice — digital marketing and
international business expansion, sold on the strength of 15+ years actually *building*
businesses in Colombia, the U.S., and Canada, not consulting about them from the outside.

**Two service tracks:**
- **Track A — Digital Marketing.** Growth marketing / fractional CMO for Hispanic-owned
  businesses operating in the U.S. and Canada. Paid media (Meta/Google), email, go-to-market
  strategy, embedded senior marketing leadership.
- **Track B — International Expansion.** Market entry between Colombia, the U.S., and Canada in
  either direction: entity formation, registered agent, banking, local business development,
  supplier/distributor relationships.

**Competitive advantage:** lived experience, not theory. José has personally built and scaled
businesses in all three countries — a rare, concrete, hard-to-fake credential (see the resume
stats: $10M+ revenue under active management, $1M business built from zero, 37 entities
incorporated internationally).

---

## Brand & Messaging Guidelines (canonical)

> Single source of truth for ALL Ubik 360 marketing communication — blog, email, social,
> ads, site copy. Any AI content generator built for Ubik 360 must be prompted from this
> section, and this section must be updated first if positioning changes.

**Brand voice:** direct, credible, unapologetically opinionated. Practitioner talking to another
business owner — not agency-speak, not corporate filler. Backs claims with specific numbers and
specific stories, never vague superlatives. Comfortable being blunt: "I don't tell you what you
want to hear." Warm underneath the bluntness — family, discipline, curiosity (~20 books/year) are
part of the brand, not just credentials.

**Tone rules:**
- Prefer concrete numbers and named specifics over adjectives ("$1M in 4 years," "37 entities,"
  not "significant growth").
- First person, active voice. José is the brand — never write as an anonymous agency ("we" is
  fine for the work; the person behind it should stay visible).
- Short, declarative sentences over long qualified ones.
- It's fine — encouraged — to state an unpopular or uncomfortable opinion when it's true. That's
  the differentiator, not a risk to hedge away.
- Bilingual (EN/ES) — translate voice, not just words. Don't flatten the directness in Spanish
  copy to sound more "polite generic consultant."

**Brand tokens** (from `assets/css/main.css` — keep any generated visual assets on-palette):
`--red: #931F1D` (CTAs) · `--black: #050505` (text) · `--green: #659157` (accents) ·
`--oak: #CEC5B5` (light backgrounds). Headings in DM Serif Display, body in Inter.

**NEVER:**
- ❌ Generic consultant clichés ("take your business to the next level," "unlock your potential,"
  "in today's fast-paced world").
- ❌ Claims or numbers not traceable to something real José did. No invented stats.
- ❌ Flattening the tri-national story into generic "international experience" — the specificity
  (Barranquilla, Miami, Las Vegas, London Ontario) IS the credibility.
- ❌ Corporate-anonymous voice. If copy could have been written by any agency about any founder,
  it's off-brand.
- ❌ Over-hedging. The brand's edge is directness; don't soften it into safe consultant-speak.

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

**Proposed stack** (mirrors a proven pattern from prior work, adapted — not shared code):
- **Backend:** Node/Express (or similar lightweight API), deployed on DigitalOcean App Platform
  or Vercel serverless functions — pick based on where the rest of Ubik 360 infra lands.
- **Database:** Supabase Postgres — admin-key-gated `/admin/*` routes, public read-only where needed.
- **Blog:** static HTML pages under `ubik360.com/blog/` (folder, not a subdomain — Jose's
  preference for this site), generated by an AI tool (Claude) and committed straight into this
  repo alongside the rest of the static site. Brand-voice-prompted from this file's guidelines
  section, with cover + in-article images and a **syndication kit**: per-post AI-drafted copy for
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
