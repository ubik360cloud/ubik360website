# Ubik 360 — Marketing Context

> Companion to [CLAUDE.md](./CLAUDE.md) (site structure/dev conventions). This file is the
> canonical source for brand voice, positioning, audience, and the marketing backend plan.
> Wholly scoped to **ubik360.com** — a separate business from any of José's other ventures;
> nothing here shares infrastructure, code, or data with them. Keep this file and any AI
> content-generation prompts in sync — drift between them is how brand voice degrades over time.

**Status (2026-07): strategy layer is settled** — positioning, audience/ICP, brand voice, tone
rules, and NA/LatAm messaging direction are all finalized and internally consistent (see sections
below). **Copy execution is partial** — full copy decks exist only for the EN homepage and EN
about page (both drafted below, not yet applied to `.astro` files). Everything else
(`en/digital-marketing.html`, `en/nearshore-staffing.html`, `en/international-expansion.html`,
and the entire `es/` side: homepage, about, contact, expansion-internacional) has an agreed
*direction* but no drafted copy deck yet — those will be written directly against the strategy
below at execution time, the same way the homepage/about drafts were produced.

---

## Anonymous/bigger-company positioning test (2026-07, active — TEMPORARY)

**Status: live on the `astro-migration` branch / Vercel preview, not the real domain.** This is a
deliberate, time-boxed experiment layered on top of everything below — it does not replace the
strategy, it tests a variant of it. Treat every file tagged
`// TEMPORARY TEST VARIANT (2026-07, Jose)` as reverting to the José-named version once the test
concludes.

**What changed and why:** Jose incorporated as **Ubik 360 Enterprises** (Wyoming — 30 N Gould St
Ste R, Sheridan, WY 82801) and wants to test whether the site reads as a larger, more established
firm rather than a solo consultant — targeting businesses with **$5M+ in annual revenue** rather
than the broader small-business range the core positioning above addresses. The hypothesis: at
that deal size, buyers may trust an organization more readily than a named individual consultant,
even a well-credentialed one.

**What actually changed:**
- Homepage (EN/ES), About/Sobre Mí, and Contact/Contacto pages no longer name Jose or show his
  face. `orgSchema` (Organization, not Person) replaces the personal schema everywhere, carrying
  the Wyoming entity name and address.
- New "Leadership" section (homepage + About) describes the team's composition — marketing/sales/
  international-ops leadership, UX/UI collaborators, a paid-media partner (Digital Jockey), and a
  bilingual/trilingual market-research economist — without naming anyone. This is accurate: Jose
  does work with real contractors and collaborators, this isn't a fabricated team.
- New `PartnerLogos` carousel (`src/components/PartnerLogos.astro`) on both homepages, framed as
  "Partners We've Grown With" — Gasolutions, Digital Jockey, CEO US University, 360 Print Studio,
  and Mukura Apparel. Per Jose's clarification, several of these are genuine past/ongoing
  consulting or freelance engagements, not current retained clients (e.g. Mukura: Jose was
  founder, exited, still consults on international expansion; CEO US University: completed
  go-to-market consulting engagement; Gasolutions: ad-hoc marketing/international-ops consulting).
  Logos were included on the basis that the underlying relationships are real, per Jose's explicit
  confirmation — not because "partner" is being used loosely.
- Nav/Footer "About"/"Sobre Mí" relabeled to "Team"/"Nuestro Equipo" to match.
- Personal LinkedIn profile link removed from Footer and Contact pages (conflicts with the
  no-name/no-face premise; no company LinkedIn page exists yet to link instead).
- Footer copyright line now reads "Ubik 360 Enterprises" + the Wyoming mailing address.
- Personal portrait placeholders removed from About/Contact hero sections; homepage heroes swapped
  from personal photos to stock skyline images (Miami/Toronto).

**Explicitly NOT changed (deliberately out of scope for this test):**
- `en/digital-marketing.astro`, `en/nearshore-staffing.astro`, `en/international-expansion.astro`,
  `es/expansion-internacional.astro` — not yet audited for leftover first-person "I" language.
- The Calendly booking link (`calendly.com/jose-ubik360/30min`) still contains "jose" in the URL
  itself — not addressed; low visibility (users don't typically read URLs closely) and changing it
  would require a new Calendly account/link, judged not worth doing for a temporary test.
- `jose@ubik360.com` contact email kept as-is — it's the established, working contact address, and
  changing it would break continuity if the test is reverted.

**Revert plan (when the test concludes):** go back to Jose as the named face of Ubik 360, but
**as President or CEO, not "Founder"** — the goal is to avoid solopreneur/owner framing even in
the named version, not to return to the original résumé-led About page. Restore Person schema,
restore the real photo (`public/assets/images/photos/shot-05-walking-canada.jpg`, kept in place
and unused rather than deleted specifically for this), restore "About"/"Sobre Mí" nav labels,
restore the personal LinkedIn link, and remove the anonymous Leadership sections and partner-logo
carousel (or keep the carousel if it tests well — that's a separate decision from the name/face
question).

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
- **Write for business owners, not marketers writing to other marketers.** No marketing-industry
  jargon (ROAS, funnel optimization, omnichannel, growth hacking) — a founder who's never worked
  in marketing should understand every sentence on first read.
- **Use concrete, plain-English outcome language**, not abstractions: "reduce manual work,"
  "improve conversion," "support expansion," "modernize systems," "lower risk" — a verb the
  reader can picture + a business result, not a marketing-speak noun phrase.
- **Authority comes from clarity, not self-praise.** The way to sound like an expert is to explain
  something clearly and specifically — not to say "expert" about yourself. If a sentence's only
  job is to make Ubik 360 sound impressive rather than to inform the reader, cut it.
- **Separate proof from personality, structurally.** Proof (outcomes, cases, process, experience)
  belongs in dedicated proof sections/moments — factual, evidence-based, no personal color.
  Personality (tone, perspective, working style) belongs in voice and framing throughout the
  copy — not in the proof itself. Don't blend them: a case-outcome sentence shouldn't carry a
  personality aside, and a philosophy/approach section shouldn't smuggle in unproven claims.

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
- ❌ Marketer-to-marketer jargon (see "Write for business owners" above) — if a term needs a
  marketing background to parse, replace it with plain language.
- ❌ Self-praise as a substitute for clarity ("we're the best at X") — explain the thing, don't
  rate it.

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

**⚠ ICP refinement (2026-07):** this is specifically **mid-sized and larger businesses ready to
invest** in expansion (overseas operations, bilingual staff, exports/international customer
service infrastructure) — not any Colombia/LatAm business regardless of size or readiness. See
"Market-Specific Copy Directions" below for the full reasoning (an underprepared client who
expands anyway is likely to fail and blame Ubik 360 for it) and how that shapes LatAm copy/CTAs
to self-select for readiness.

**EN visitor = U.S./Canada business owner, reaching inward.** Real pain (updated 2026-07 — see
"Growth marketing: general positioning, not Hispanic-market-specific" below):
- Reliable overseas/nearshore staff (Colombia/LatAm) without full-time-hire overhead.
- General growth marketing / fractional CMO leadership — not limited to a single vertical or the
  Hispanic-market angle.
- Sourcing vendors/manufacturing partners in LatAm.
→ Nearshoring + growth marketing/fractional CMO + sourcing, sold as one journey.

**⚠ ICP refinement (2026-07):** specifically **founders, SMEs, decision-makers, and business
owners** — this job-title/company-size definition also drives the Apify cold-lead search filters
(see "Marketing Backend — Plan" → Lead generation). See "Market-Specific Copy Directions" below
for the full NA copy direction.

**⚠ Superseded asset:** the existing `en/digital-marketing.html` lead magnet ("Hispanic Market
Accelerator... for Home Service Businesses") was written under the old Hispanic-market-specific
framing and is now misaligned with general growth marketing positioning. Don't reuse it as-is
when the page is rewritten — needs a new, broader lead magnet (or a reworked version of it),
decided at content-execution time.

**Growth marketing: general positioning, not Hispanic-market-specific (resolved 2026-07, Jose):**
NA growth marketing/fractional CMO is now positioned for **any NA business**, not gated to a
single industry — Jose's proven niche is **auto-dealerships**, but he doesn't want the pitch
narrowed to that vertical and lose other opportunities. Resolution: **lead broad, prove
narrow.** The page's core positioning and headline offer stay general (any growth-stage NA
business); auto-dealership experience becomes the **flagship proof point** — case
examples/process description drawn from that work, used as evidence of real results, not as a
gate on who the service is for. Practical implications for the rewrite:
- Headline/hero copy: general growth marketing + fractional CMO offer, no industry qualifier.
- Proof section: lead with auto-dealership case examples/outcomes (per the brand voice rule —
  process and outcomes, not personal résumé) since that's the strongest evidence available.
- Optional (future, not urgent): a dedicated auto-dealership-specific section or landing page can
  exist *alongside* the general page without replacing it, if/when there's enough proof content
  to justify a dedicated funnel — but the main service page must stay industry-agnostic in its
  primary framing.

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
| `en/index.html` | Homepage | Hero splits between the two real EN offers: general growth marketing/fractional CMO, and reliable LatAm staff/sourcing (nearshoring) — replaces the current Track-A/Track-B split. |
| `en/digital-marketing.html` | **Rewrite needed** | Reposition from Hispanic-market-specific to general growth marketing/fractional CMO for any NA business, with auto-dealership case examples as flagship proof (see Audience/ICP "Growth marketing" note above). Existing "Hispanic Market Accelerator" lead magnet is superseded — needs a new one. Also gets the content-quality pass below. |
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

## Homepage Copy — Draft (2026-07, not yet executed into pages)

> Written per Jose's prompt: the homepage must clearly separate the two audiences (NA vs.
> LatAm/bilingual), lead with value prop in the first two lines, speak to business pain/outcomes/
> growth, avoid buzzwords, stay expert/practical/credible, avoid résumé/bio framing, avoid
> overusing "I", and show authority through services/process/results. **This is copy strategy for
> `en/index.html` — the master version this audience is native to.** `es/index.html` needs its own
> LatAm-first pass (not a translation of this — same rule as everywhere else on this site), lead
> with the LatAm section first, and is not drafted here yet.

**Hero headline:**
> Marketing that performs. Expansion that works. On both sides of the border.

**Hero subheadline:**
> Fractional marketing leadership and Latin America staff augmentation for North American
> businesses. Go-to-market strategy and market entry for Latin American businesses expanding into
> Canada and the U.S.

**Intro section:**
> Growing a business is straightforward until it crosses a border. North American companies need
> marketing that performs and staff they can rely on — without the cost of building an offshore
> team from scratch. Latin American companies need a structured way into markets they don't yet
> operate in — not just paperwork, but a real go-to-market plan. Ubik 360 works both sides of that
> problem, as one accountable partner.

**North America service section:**
- Eyebrow label: "For North America"
- Headline: "Marketing leadership and staff you can rely on."
- Body: "Fractional CMO leadership and growth marketing built around pipeline, revenue, and
  retention — not impressions. Staff augmentation in Latin America gives your team skilled,
  accountable people for customer service, back-office, and sales support, at a fraction of local
  hiring cost."
- Services list: Fractional CMO / marketing leadership · Growth marketing (paid media, email,
  go-to-market strategy) · LatAm staff augmentation (customer service, back-office, appointment
  setting)
- CTA: **"Schedule a Growth Call"** → Calendly

**LatAm service section:**
- Eyebrow label: "For Latin America & Bilingual Markets"
- Headline: "A structured way into Canada and the U.S."
- Body: "Expanding north isn't just paperwork. Entity formation and banking get you registered —
  go-to-market strategy, local operations support, and market-entry marketing get you actually
  doing business. Ubik 360 manages the full path, not just the legal first step."
- Services list: Entity formation, registered agent, banking · Go-to-market and market-entry
  strategy · Local operations efficiency once established
- CTA: **"Start Your Expansion Plan"** → contact / Calendly

**Why Ubik 360 section** (authority via services/process/results, not personal bio):
- Headline: "Why businesses work with Ubik 360"
- One partner, both sides of the border — no handoff between a North American agency and a
  separate LatAm consultant; one team, one process, one point of accountability.
- A structured process — discovery, plan, execution, and optimization, with clear milestones at
  each stage, not an open-ended retainer.
- Direct access to the people doing the work — not routed through account managers.
- Outcomes measured in business terms — pipeline generated, cost saved, markets entered — not
  vanity metrics.

**CTA copy (consolidated):**
- NA: button **"Schedule a Growth Call"**, microcopy "30 minutes, no obligation."
- LatAm: button **"Start Your Expansion Plan"**, microcopy "Free initial consultation."
- (Spanish equivalents pending the ES homepage's own LatAm-first copy pass.)

**Supporting microcopy:**
- Trust line (hero or footer strip): "Operating across the United States, Canada, and Latin
  America."
- Contact/form microcopy: "We respond within 24 hours."
- Section eyebrows use the existing `.section-tag` pattern already in the codebase (small,
  uppercase, brand-green) — "For North America" / "For Latin America & Bilingual Markets" above.

---

## About Page Copy — Draft (2026-07, not yet executed into pages)

> Rewrite of `en/about.astro`'s content (currently still the old résumé-led port — see CLAUDE.md
> "Migration status"). Per Jose's brief: human but business-first, credibility through experience/
> perspective/method/client outcomes — not résumé, vanity metrics, or hobby content (explicitly:
> no "20 books a year," no personal-hobby color). A personal detail earns its place only if it
> supports trust or explains how Jose works. Two personal facts passed that bar and one didn't:
> - **Kept, reframed:** introversion / comfort mastering-and-presenting a topic vs. small talk →
>   becomes "prepared over networking" as a business-working-style differentiator (section 2).
> - **Kept, reframed:** family split between Colombia and Canada (adult kids in Canada, Jose
>   splits time between both countries) → this is literal, lived, ongoing proof of the
>   cross-border/bilingual reality the business sells, not a vanity credential (section 4). This
>   is stronger evidence than the old career-stats framing precisely because it's not an
>   achievement being claimed, it's a fact of daily life.
> - **Left out:** the evening routine (wine, Netflix, calling the kids) — same category of
>   irrelevant personal-hobby content as the old "20 books a year" line; doesn't support trust or
>   explain working method, so it stays out per Jose's own filter.
>
> `es/sobre-mi.astro` needs its own pass once this is approved — not a straight translation (same
> rule as the rest of the site), though About-page content is audience-neutral enough that a
> close adaptation (not a full rewrite like the service pages) is likely appropriate; confirm
> with Jose when that page is scheduled.

**1. Opening positioning statement**
> Ubik 360 exists because most growth problems aren't purely marketing problems or purely
> expansion problems — they're both, and they usually involve more than one country. I run this
> practice directly: no bench of account managers, no handoff after the first call. If you work
> with Ubik 360, you work with the person doing the thinking.

**2. My approach / philosophy**
> The work speaks before I do. I'd rather walk into a first conversation prepared to answer hard
> questions about your business than spend it building rapport. That's deliberate — clients don't
> need a great networker, they need someone who's done the homework and can say plainly what's
> working, what isn't, and what to do next.
>
> That means no inflated timelines, no vague promises, and no dressing up a weak plan to make a
> first call go smoothly. If something isn't going to work, you hear that in the first
> conversation — not three months into a retainer.

**3. Why businesses trust Ubik 360**
> The perspective behind Ubik 360 comes from operating, not observing — building and running
> businesses across Colombia, the U.S., and Canada, not consulting about those markets from the
> outside. That's shaped a specific method: understand the business and the market before
> proposing anything, build a plan around clear milestones instead of an open-ended retainer, and
> stay accountable for execution — not just strategy.
>
> Every engagement follows the same structure: a clear-eyed look at where the business stands
> today, a plan built around realistic outcomes, hands-on execution, and ongoing adjustment based
> on what the data actually shows — not what looks good in a report.

**4. Cross-border and bilingual advantage**
> Cross-border isn't a service category for Ubik 360 — it's daily life. My family is split
> between Colombia and Canada: my kids live in Canada, and my wife and I split our time between
> both countries. That's not a credential — it's just the reality that makes the bilingual,
> bicultural side of this work second nature instead of theoretical.
>
> Practically, that means positioning, messaging, and go-to-market plans get built with real
> cultural and regulatory fluency, not translated after the fact — whether the direction is a
> Colombian company entering the U.S. or Canadian market, or a North American company building a
> team or reaching a market in Latin America.

**5. Closing CTA**
> If your business is ready for marketing that performs, staff you can rely on, or a real plan to
> cross into a new market — let's talk. Thirty minutes is enough to know if it's a fit.
> **[Schedule a Call]**

---

## Market-Specific Copy Directions — NA vs. LatAm (2026-07)

> Elaborates the Messaging Framework above into working copy directions per market. **New ICP
> refinement this pass, not previously captured:** NA audience is specifically **founders, SMEs,
> decision-makers, business owners** — chosen partly because this job-title/company-size
> definition is what will drive the Apify cold-lead search filters later (see "Marketing Backend
> — Plan" → Lead generation, cross-referenced below). LatAm audience is refined to **mid-sized and
> larger businesses specifically ready to invest** in expansion (overseas operations, bilingual
> staff, exports/international customer service infrastructure) — **not** any Colombia/LatAm
> business. Jose's stated reason: an underprepared client who expands without that readiness is
> likely to fail regardless of the plan, and would blame Ubik 360 for it. This is a real
> qualification/disqualification signal, not just a tone note — LatAm copy should self-select for
> readiness (see CTA style + hero below), not just describe the service.

### North America

1. **Core promise:** Senior marketing leadership that moves pipeline and revenue, plus reliable
   Latin America staff — without the cost of building either function in-house.
2. **Key pain points:** Marketing spend without measurable pipeline/revenue; no senior marketing
   leadership in-house but not ready for a full-time CMO hire; local hiring for customer
   service/back-office/appointment-setting roles is slow, expensive, and hard to retain;
   watching competitors move faster because they've solved "senior marketing + lean ops" already;
   burned before by agencies that overpromise or internal hires that take months to ramp.
3. **Key benefits:** Fractional CMO-level leadership without executive overhead; growth marketing
   tied to pipeline/revenue, not vanity metrics; accountable LatAm staff at a fraction of local
   hiring cost; one point of accountability instead of juggling an agency + a recruiter + an ops
   vendor separately; direct access to the person doing the work.
4. **Best proof types:** Process description (discovery → plan → execution → optimization);
   concrete outcome language (pipeline generated, cost-per-acquisition improved, roles filled and
   retained); anonymized case examples — auto-dealerships are the flagship proof vertical (see
   Audience/ICP "Growth marketing" note above) without gating who the page is for. Never invent a
   number Jose hasn't confirmed.
5. **CTA style:** Direct and low-friction. No urgency/pressure language. "Schedule a Growth Call" /
   "See how it works for your business" — a straightforward booking ask, not a hard sell.
6. **Words to use:** pipeline, revenue, retention, accountable, structured, direct, practical,
   measurable, fractional, embedded, senior, reliable, execution.
7. **Words to avoid:** hype terms (game-changing, revolutionary, unlock, next level), vague
   superlatives (best-in-class, world-class), filler jargon (synergy, leverage-as-verb,
   disruptive), and anything résumé/personal-bio-flavored.
8. **Sample hero section:**
   > Headline: "Senior marketing leadership. Reliable LatAm staff. Without the full-time
   > overhead."
   > Subhead: "Fractional CMO leadership and growth marketing built around pipeline and revenue —
   > plus staff augmentation in Latin America for the roles that are hard to fill and expensive to
   > keep local."
   > CTA: "Schedule a Growth Call"

### LatAm / Bilingual Markets

1. **Core promise:** A structured, accountable path into Canada and the U.S. — market entry,
   go-to-market strategy, and the operational groundwork to make the move work long-term, not
   just the legal first step.
2. **Key pain points:** Uncertainty about legal/regulatory requirements (entity formation,
   banking, compliance); risk of expanding without the internal readiness to actually execute
   (bilingual staff, processes, customer-facing infrastructure) — the real failure mode Jose wants
   to screen for; difficulty finding a guide who understands both the home market and the
   destination market, not just an incorporation service; language/cultural gaps in marketing and
   customer communication; fear of costly missteps (wrong state/province, tax structure, a failed
   launch).
3. **Key benefits:** One structured process from entity formation through go-to-market to ongoing
   operations; bicultural, bilingual guidance, not a generic legal/incorporation service;
   localization done for the destination market, not translated after the fact; a realistic
   readiness assessment as part of the engagement (helps confirm the business is actually ready
   before committing — serves the qualification goal above); ongoing operational support post-entry.
4. **Best proof types:** End-to-end journey narrative (incorporation → first customer → stable
   operations); anonymized case examples of successful market entries; specifics about the local
   partner network (CPAs, banking partners) as evidence of a real, working process — not just a
   claim.
5. **CTA style:** Warmer and more relational than the NA CTA, but still qualifying, not just
   inviting — the copy should read as "come talk to us if you're ready to invest in this
   properly," not "anyone can do this easily." Explicitly **avoid** language that makes expansion
   sound trivial or fast (see banned words below) — that's exactly what attracts underprepared
   leads who fail and blame Ubik 360.
6. **Words to use (Spanish-market register):** estructurado, acompañamiento, socio, cercanía,
   claridad, resultados reales, preparación, sólido, a la medida.
7. **Words to avoid:** the general banned-hype list, **plus market-specific additions**: "fácil,"
   "sin complicaciones," "en días," "garantizado," "sin riesgo" — anything that undersells the
   effort/investment required, since overselling ease is precisely what produces an underprepared,
   unhappy client.
8. **Sample hero section** (written in Spanish — this is the actual visitor-facing language,
   unlike the homepage copy deck above which is still pending its own LatAm-first ES pass):
   > Headline: "Tu expansión a Canadá y EE.UU., con un proceso estructurado de principio a fin."
   > Subhead: "Entrada a mercado, localización y soporte operativo para empresas listas para
   > invertir en su crecimiento internacional — no solo trámites de incorporación."
   > CTA: "Agenda tu Consulta de Expansión"

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
- **Lead generation:** Apify-based scrape → verify → promote pipeline. **NA channel** targets
  founders/SMEs/decision-makers/business owners (job-title + company-size filters, per the
  ICP definition in "Market-Specific Copy Directions" above) via a Google Maps/LinkedIn-style
  discovery step. **LatAm channel** targets mid-sized-and-larger businesses specifically —
  company-size filtering matters here more than for NA, since the ICP explicitly excludes
  smaller/underprepared businesses (see "Audience/ICP" ⚠ note above) — likely needing an
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
