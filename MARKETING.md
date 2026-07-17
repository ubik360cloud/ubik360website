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

## Audience / ICP

**Track A (Digital Marketing) — Hispanic-owned businesses in the U.S. and Canada.**
Have talent and drive, lack structure and strategic marketing backing. Likely local/regional
SMBs — retail, services, e-commerce, wholesale — owner-operated or small teams.

**Track B (International Expansion) — two directions:**
- Colombian companies with a real product wanting to enter the U.S./Canada, held back by
  language and unfamiliarity with the market (not by lack of ambition or product quality).
- U.S./Canada companies wanting a foothold in Colombia — need an on-the-ground advisor who
  knows the culture, compliance, and local partners.

Both tracks skew toward founder-led, small-to-mid businesses making a first cross-border or
first-real-marketing-strategy move — not enterprises with in-house teams already.

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
- **Blog:** Astro → MDX, deployed on a `blog.ubik360.com` subdomain (Vercel), keeping the main
  static site untouched. AI-generated (Claude), brand-voice-prompted from this file's guidelines
  section, with cover + in-article images and a **syndication kit**: per-post AI-drafted copy for
  LinkedIn (post + first comment), Medium.com (subtitle, tags, canonical import link), and social
  captions — one generation pass, copy-paste distribution.
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
- Blog subdomain vs. `/blog/` path on the main site — subdomain (Astro) keeps the static site
  untouched and matches the proven pattern; confirm before building.
- Whether paid engagements (e.g. a bookable "Market Entry Checklist" or productized package) ever
  need payment processing — out of scope until asked for.

---

## Known content assets already on the site (for the blog/email tool to draw context from)

- `assets/downloads/*.html` — existing lead-magnet pages (USA incorporation checklist, Hispanic
  market accelerator, admin scale-up, lead-generation-by-proximity, a CEO/university report).
  These are a ready source of topics and existing positioning to stay consistent with.
- `en/about.html` / `es/sobre-mi.html` — the fullest expression of brand voice on the site today;
  use as the canonical voice reference alongside this file's guidelines section.
