# Ubik 360 Website — CLAUDE.md

> For brand voice, messaging guidelines, audience/ICP, and the marketing backend plan, see
> [MARKETING.md](./MARKETING.md). This file covers site structure and dev conventions only.

## What this is
Bilingual marketing website for **Ubik 360** (legal entity: Ubik 360 Enterprises, Wyoming),
José Villegas's consultancy — built with [Astro](https://astro.build) (static output), deployed on
Vercel. **The site currently presents anonymously** (no personal name/face, team voice
throughout) as a deliberate, temporary positioning test — see MARKETING.md "Anonymous/
bigger-company positioning test" before assuming this is a bug or reverting it.

**EN and ES are not translations of each other — they're different offers to different
audiences**: Colombia/LatAm business owners expanding outward on ES (plus an ES-only LatAm AI-
implementation service with no EN equivalent); U.S./Canada business owners reaching inward for
general growth marketing/fractional-CMO + LatAm nearshore staffing on EN (this broadened from an
earlier Hispanic-market-specific framing — see MARKETING.md's "Growth marketing: general
positioning" note). See MARKETING.md's "Audience / ICP" section before touching any EN or ES
page — never assume a page should mirror its other-language counterpart, or that every page needs
one at all.

Repo: https://github.com/ubik360cloud/ubik360website (branch `astro-migration` — this is also the
live Production branch, see "Hosting / deployment" below).

## Migration status (as of 2026-07)
The site was previously plain static HTML with no build step (Tailwind CDN, JS-injected
nav/footer, hand-maintained sitemap — see MARKETING.md for why that was replaced). The Astro
rebuild is **live in production** on `ubik360.com` (see "Hosting / deployment" below) — fully
deployed, DNS cut over from Hostinger, not just a preview.

**14 pages, all with real content:** `en/index.astro`, `en/about.astro`,
`en/digital-marketing.astro`, `en/nearshore-staffing.astro`, `en/international-expansion.astro`,
`en/contact.astro`, `en/thank-you.astro`, `es/index.astro`, `es/sobre-mi.astro`,
`es/expansion-internacional.astro`, `es/soluciones-ia.astro` (new, **ES-only, no EN
counterpart** — see MARKETING.md "AI Solutions" section), `es/contacto.astro`, `es/gracias.astro`,
plus the root language-redirector. Build verified clean (`npx astro build`).

**Also currently active — see MARKETING.md "Anonymous/bigger-company positioning test":** the
site presents anonymously (no personal name/face, Organization schema not Person) as a deliberate,
temporary experiment. Don't "fix" this back to a named-person site without checking that section
first — it's intentional, not an oversight, and has an explicit revert plan documented there.

**Explicitly NOT done yet (real gaps, not oversights):**
- Legal pages (`public/Privacy-Policy.html`, `Terms-of-Service.html`) are still unconverted
  legacy HTML, copied as-is — not yet Astro components.
- `public/assets/downloads/*.html` has 4 legacy lead-magnet files; only 2 are actually linked from
  any page (`administrative-scale-up-ubik360.html` via `en/nearshore-staffing.astro`,
  `checklist-incorporacion-usa-ubik360.html` via `es/expansion-internacional.astro`) — the other
  two (`captacion-leads-proximidad-ubik360.html`, `hispanic-market-accelerator-ubik360.html`) are
  orphaned, kept but unreferenced. Deliberately not adding more lead magnets right now — see
  MARKETING.md's lead-magnet note.
- A "create newsletter (with template) and send via Brevo" backend tool was requested 2026-07 but
  explicitly deferred to its own session — see MARKETING.md "Marketing Backend — Plan".

## Structure
```
astro.config.mjs        → site URL (https://ubik360.com — real domain, already live), build.format:
                          'file' (preserves legacy /en/about.html-style URLs instead of Astro's
                          default clean-directory URLs — see note below)
vercel.json              → rewrites /en/ and /en/index.html (and /es/ equivalents) to the physical
                          en.html/es.html build output (see "Homepage URL quirk" below), plus
                          redirects for URLs that changed shape during the rebuild (e.g. the old
                          es/marketing-digital.html)
api/subscribe.js        → Vercel serverless function (root-level /api dir, auto-detected by
                          Vercel independently of the static Astro build — no adapter/output-mode
                          change needed). Adds newsletter/contact-form emails to Brevo — see
                          "Newsletter (Brevo)" below.
src/layouts/Layout.astro → shared <head> (SEO meta, hreflang, OG, GTM, JSON-LD slot), wraps
                          Nav + page content + Footer + NewsletterPopup + chat widget script
src/components/Nav.astro    → real component (not JS-injected) — EN and ES link arrays are
                              independent, edit each separately
src/components/Footer.astro → same pattern; both EN and ES now have 3 columns (ES gained a
                              "Soluciones de IA" column alongside Expansión Internacional/Ubik 360)
src/components/PartnerLogos.astro → logo carousel (grid on desktop, horizontal scroll-snap
                          carousel on mobile); each logo's card background is set per-logo (`bg`
                          field) to match/contrast with that specific logo, not a single default
src/components/NewsletterInline.astro, NewsletterPopup.astro → newsletter signup UI, POST to
                          /api/subscribe — see "Newsletter (Brevo)" below
src/utils/langMap.ts     → explicit EN⇄ES page-equivalence map used by the language toggle (Nav +
                          Footer) — falls back to that language's homepage for pages with no real
                          counterpart, rather than guessing at a misleading match
src/styles/global.css   → Tailwind v4 CSS-first theme (@theme block = brand tokens as real
                          Tailwind colors) + legacy `--red`/`--black`/`--green`/`--oak` variable
                          aliases so ported page markup keeps working without a find-replace pass.
                          `h1,h2,h3` get the serif display font — NOT h4 (Footer's column titles
                          are the only h4 on the site and must stay sans-serif; a stray h4 in this
                          selector fake-bolded and looked blurry at small size, see git history)
src/pages/en/            → English pages: index, about (Team), digital-marketing,
                          nearshore-staffing, international-expansion, contact, thank-you
src/pages/es/            → Spanish pages: index (LatAm-first, not a translation of en/index),
                          sobre-mi (Nuestro Equipo), expansion-internacional, soluciones-ia
                          (NEW, ES-only, no EN counterpart — LatAm AI-implementation service),
                          contacto, gracias
src/pages/index.astro    → JS language-redirector (noindex,nofollow) — NOT a homepage, just picks
                          /en/ or /es/ by browser language
public/assets/           → images (stock/, partners/, photos/), downloads (legacy lead-magnet
                          HTML, unconverted), chat widget JS
public/Privacy-Policy.html, Terms-of-Service.html → legacy pages, copied as-is (unconverted —
                          still plain HTML, not yet Astro components)
```

**Homepage URL quirk:** Astro's `build.format:'file'` promotes a directory's `index.astro` up a
level (`src/pages/en/index.astro` → physical file `en.html`, not `en/index.html`) — a known Astro
behavior, not a bug in this project. Legacy canonical tags already point at `/en/` (bare, no
`index.html`) and internal links use `/en/index.html`; `vercel.json` rewrites both to the physical
`en.html` output so neither URL breaks and `/en.html` itself is never linked anywhere.

**hreflang:** only set `alternatePath` on `<Layout>` where a page genuinely has a same-content
counterpart in the other language (currently just home↔home, about↔sobre-mi, contact↔contacto,
thank-you↔gracias — see `src/utils/langMap.ts`, which the language-toggle links use so this stays
consistent). Never set it between pages with different content (e.g. the two homepages' actual
content, or `es/soluciones-ia.astro` which has no EN equivalent at all) — that would assert a
translation relationship that isn't true, which actively hurts SEO. See MARKETING.md.

## Brand tokens (`src/styles/global.css` `@theme` block)
```
--color-brand-red:   #931F1D   /* CTAs, buttons */
--color-brand-black: #050505   /* text, dark sections */
--color-brand-green: #659157   /* accents, section tags */
--color-brand-oak:   #CEC5B5   /* light section backgrounds */
```
Also aliased as legacy `--red`/`--black`/`--green`/`--oak` for ported inline styles. Headings use
`DM Serif Display`; body text uses `Inter`. Reusable classes (`.btn-primary`, `.btn-outline`,
`.section-tag`, `.service-card`, `.check-list`, `.step-badge`) are defined once in `global.css` —
same names as the legacy `assets/css/main.css`, now real Tailwind `@apply` compositions.

## Chat widget
`public/assets/js/ubik360-chat-widget.js` renders a floating chat bubble and talks to a separate
backend: `https://ubik360-bot-production.up.railway.app/chat` (Railway-hosted bot, outside this
repo). Loaded once, globally, in `Layout.astro`. **2026-07:** the client-side copy (greeting,
subtitle, quick-reply prompts) was scrubbed of "Jose"/personal references to match the anonymous
positioning test, and prompts updated from old Hispanic-market-specific framing to general growth
marketing. **This only covers the widget's visible strings** — the bot's actual conversation logic
and knowledge base live in the separate Railway service and were NOT updated; that service needs
its own review to stay consistent with current positioning (out of reach from this repo).

## Newsletter (Brevo) — added 2026-07
`NewsletterInline.astro` (homepage section) and `NewsletterPopup.astro` (site-wide bottom-corner
slide-in, scroll/time/exit-intent triggered) POST `{ email, lang, source }` to `/api/subscribe`
(`api/subscribe.js`, a Vercel serverless function auto-detected from the root `/api` directory —
deliberately not an Astro API route, so no `output`/adapter change was needed on the otherwise-fully-
static site). The function calls Brevo's REST API server-side, keeping `BREVO_API_KEY` out of the
client entirely. `source` maps to a specific Brevo list, chosen server-side (a client can't pass an
arbitrary list ID):
- `"newsletter"` (default) → list 2 — used by both newsletter forms.
- `"contact"` → list 3 — fired best-effort by `en/contact.astro`/`es/contacto.astro` right after
  their existing Formspree submission succeeds, without blocking the redirect on it. Formspree
  stays the actual lead-notification mechanism; Brevo is just getting the contact into a list too.

List IDs are overridable via `BREVO_LIST_NEWSLETTER` / `BREVO_LIST_CONTACT` env vars.
`updateEnabled: true` on the Brevo call means re-subscribing an existing contact updates them
instead of erroring.

**Two real gotchas hit while wiring this up — check these first if it breaks again:**
1. **Env var timing:** Vercel env vars only apply to deployments created *after* the var was
   added — adding `BREVO_API_KEY` in the dashboard does nothing until the next deploy. If a
   just-added key still seems to fail with "Server not configured," push a trivial commit (or
   redeploy) rather than assuming the key itself is wrong.
2. **Brevo IP allowlisting:** Brevo can restrict API access to specific IPs, and it's a **separate
   toggle for SMTP keys vs. REST API keys** on the same settings page
   (`app.brevo.com/security/authorised_ips`) — disabling it under the wrong tab looks identical
   from the outside (same 401 `unauthorized: unrecognised IP` error) and is easy to miss. Vercel
   serverless functions don't have a single static outbound IP on the Hobby plan, so this
   restriction needs to be off (or would need Vercel's paid static-IP add-on) for the integration
   to work at all.

The repo has a linked Vercel CLI (`.vercel/project.json` present) — `npx vercel env ls`,
`npx vercel ls`, and `npx vercel logs <deployment-url>` are useful for debugging this kind of thing
directly instead of guessing.

**Future/deferred (2026-07, Jose):** a backend tool to compose and send an actual newsletter
(with templates) through Brevo was requested but explicitly deferred to its own session — not
started. See MARKETING.md "Marketing Backend — Plan" for the open question of whether that should
be a custom tool or just Brevo's own campaign composer.

## Known fixes made during the port (don't reintroduce these bugs)
- **WhatsApp number:** the legacy `en/contact.html`/`es/contacto.html` linked a fake placeholder
  number (`wa.me/15551234567` — a 555 number, never real). Fixed to the real number
  (`wa.me/12265030456`, i.e. +1-226-503-0456) found elsewhere on the live site
  (`assets/downloads/ceo_us_university_informe_final.html`).
- **Contact email:** legacy `includes/footer.js` used `info@ubik360.com`; this was later
  standardized sitewide (Footer + both contact pages) to `admin@ubik360.com` — **not**
  `jose@ubik360.com`, which it briefly was during the port; the personal name in the address
  conflicted with the anonymous positioning test once that started (2026-07).
- **Footer LinkedIn:** legacy footer had `href="#"` as a placeholder, later fixed to a real
  personal profile link, then **removed entirely** (2026-07) as part of the anonymous positioning
  test — no company LinkedIn page exists yet to link instead. Don't re-add a personal LinkedIn
  link without checking MARKETING.md's positioning-test section first.
- **Footer logo:** was rendered via `filter:brightness(0) invert(1)` on the full color lockup at
  36px tall — at that size the red/black marks became indistinguishable and read as a plain white
  blob. Fixed by dropping the filter and placing the real-color logo on a small white chip instead.

## Hosting / deployment
**Live in production** on `https://ubik360.com` (Vercel project `ubik360`, org
`ubik360clouds-projects`). DNS was cut over from Hostinger 2026-07 — apex `ubik360.com` is
canonical/Production in Vercel, `www.ubik360.com` 308-redirects to it (matches `astro.config.mjs`'s
`site` and every canonical tag/sitemap entry, which use the bare apex domain, not `www`). GitHub
repo is connected, and the Production environment branch is `astro-migration` (Settings →
Environments in the dashboard — **not** Settings → Git, which is where this lived in older Vercel
versions and has no API equivalent). `git push` to this branch deploys straight to production.

Hostinger hosting is retired (kept alive temporarily as a rollback safety net, DNS untouched there
beyond the website `A`/`CNAME` records — MX/email records were deliberately left alone during the
cutover). The repo's `.vercel/project.json` is already linked, so `npx vercel` CLI commands work
directly without re-linking.

## Known gaps / things to watch
- `public/assets/images/` has a few files with spaces in filenames (`profile pick black tie.png`,
  `profile pick short sleeve.png`) — avoid referencing new images with spaces; URL-encode existing
  ones if you link them.
- `.github/copilot-instructions.md`, `README.md`, and `WEBSITE-STRUCTURE-GUIDE.md` are leftover
  from an earlier (pre-Astro, pre-audience-model) version of the site — stale, ignore for current
  structure; update or remove them if they get more out of sync.
- Legal pages (`public/Privacy-Policy.html`, `Terms-of-Service.html`) and 2 of the 4
  `public/assets/downloads/*.html` lead-magnet pages are unlinked/unconverted legacy HTML.
- Contact form still submits to Formspree (`action="https://formspree.io/f/mlganpda"`) as its
  primary mechanism, now *also* best-effort adding the contact to Brevo (see "Newsletter (Brevo)"
  above) — Formspree isn't being replaced, just supplemented.
- `src/components/RouteMotif.astro` and `PlaceholderImage.astro` are likely unused now (every page
  moved to full-width photo hero banners during the 2026-07 UI pass) — check before deleting, but
  don't be surprised to find no references.
- A handful of test/debug emails (`test-verify-brevo*@example.com`) were added to Brevo lists 2/3
  while debugging the integration — safe to delete from Brevo's contact lists, not real leads.
- The Calendly link (`calendly.com/jose-ubik360/30min`) still has "jose" in the URL itself —
  known, deliberately not addressed (see MARKETING.md positioning-test section).

## Conventions
- When creating a new page, copy the closest already-ported page (`en/about.astro` or
  `en/contact.astro`) as a structural template — but write content for its actual audience (see
  MARKETING.md), never assume it should translate an existing page in the other language, and
  never assume every page needs an equivalent in the other language at all (`es/soluciones-ia.astro`
  doesn't).
- Keep the legacy `var(--red)` etc. inline styles working via the alias block in `global.css`
  rather than doing a find-replace to Tailwind classes on every ported page — lower risk, and both
  compile to the same real Tailwind-generated CSS variables.
- Dynamic Tailwind class names (e.g. `` `grid-cols-${n}` ``) don't work — Tailwind's scanner needs
  literal class strings. Pick from a small set of literal options instead (see `Footer.astro`'s
  `colsClass` for the pattern).
- `@astrojs/sitemap` generates `sitemap-index.xml` automatically at build time — don't
  hand-maintain a `sitemap.xml` file. A new page under `src/pages/` is picked up automatically;
  the only manual step for a new page is adding it to `Nav.astro`/`Footer.astro`.
- **Page/section pattern (2026-07 UI pass):** hero sections are full-width photo banners
  (`absolute inset-0` image + a two-layer gradient scrim — a directional layer for desktop plus a
  flat semi-transparent layer underneath so text stays readable even on narrow mobile widths where
  the directional fade alone wouldn't cover enough of the image), not boxed square images.
  Sections alternate background color (white/oak/red/black) rather than defaulting to
  center-aligned white throughout, and use asymmetric image+text layouts (image one side, copy the
  other) instead of stacked center-aligned blocks. Never let a flat-color section sit directly
  against the (always-black) Footer with no visual break — check the last section's background
  before adding a new page.
- **CTA copy is standardized, not freely worded per page.** The same Calendly-booking action
  should carry the same label everywhere it appears on a given page family — currently "Schedule a
  Growth Call" (EN growth-marketing pages: home, digital-marketing, about) / "Schedule a
  Consultation" (EN expansion/staffing pages) / "Agenda tu Consulta de Expansión" (ES, all pages)
  / a neutral phrase on the shared thank-you pages. Genuinely different actions on the same page
  (e.g. Contact's pick-a-slot vs. book-a-video-call vs. request-in-person) should stay worded
  differently since they're different choices, not the same CTA repeated.
- **Verify stock photo sourcing before using it, not after.** Twice during this project a
  seemingly-generic stock photo turned out to be a screenshot of a real branded product's UI (a
  LinkedIn marketing page, and separately OpenAI's ChatGPT app) — using either would have implied
  affiliation with that company. Actually view the image (not just trust a search-result
  description) before wiring it into a page, especially anything showing a phone/screen/app UI.
