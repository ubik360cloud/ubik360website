# Ubik 360 Website — CLAUDE.md

> For brand voice, messaging guidelines, audience/ICP, and the marketing backend plan, see
> [MARKETING.md](./MARKETING.md). This file covers site structure and dev conventions only.

## What this is
Bilingual marketing website for **Ubik 360**, José Villegas's consultancy — built with
[Astro](https://astro.build) (static output), deployed on Vercel. **EN and ES are not
translations of each other — they're different offers to different audiences**: Colombia/LatAm
business owners expanding outward on ES; U.S./Canada business owners reaching into the Hispanic
market + LatAm sourcing/staffing on EN. See MARKETING.md's "Audience / ICP" section before
touching any EN or ES page — never assume a page should mirror its other-language counterpart.

Repo: https://github.com/ubik360cloud/ubik360website (branch `astro-migration` during the
rebuild — see "Migration status" below).

## Migration status (as of the Astro rebuild, 2026-07)
The site was previously plain static HTML with no build step (Tailwind CDN, JS-injected
nav/footer, hand-maintained sitemap — see MARKETING.md for why that was replaced). The rebuild is
**in progress on the `astro-migration` branch**, not yet merged to `main`/deployed, and **not yet
deployed anywhere** (no Vercel project connected as of this writing).

**All pages have real content now** (as of the brand-voice/positioning rewrite — see
MARKETING.md for the full copy strategy this was written against): `en/index.astro`,
`en/about.astro`, `en/digital-marketing.astro`, `en/nearshore-staffing.astro` (new),
`en/international-expansion.astro` (narrowed scope), `en/contact.astro`, `en/thank-you.astro`,
`es/index.astro`, `es/sobre-mi.astro`, `es/expansion-internacional.astro` (absorbed the old
`marketing-digital.html`), `es/contacto.astro`, `es/gracias.astro`. Nothing is a `TODO(content)`
placeholder anymore — build verified clean (`npx astro build`, 13 pages, no errors), all internal
links audited and resolve to real pages/anchors.

**Explicitly NOT done yet (real gaps, not oversights):**
- No new lead-magnet asset was written for `en/digital-marketing.html` — the old "Hispanic Market
  Accelerator" was retired (wrong positioning now) and the page currently uses a direct
  Calendly CTA instead of a gated download. `en/nearshore-staffing.html` reuses the existing
  "Administrative Scale-Up" asset, which still fits.
- `en/thank-you-expansion.html`, `es/gracias-checklist.html` (the old lead-magnet-specific
  thank-you pages) were not recreated — `en/thank-you.astro`/`es/gracias.astro` are generic
  versions used by every form on the site now.
- Legal pages (`public/Privacy-Policy.html`, `Terms-of-Service.html`) and the lead-magnet
  downloads in `public/assets/downloads/` are still unconverted legacy HTML, copied as-is.
- Nothing has been deployed. Vercel project setup, DNS cutover from Hostinger, and a final
  content read-through by Jose are all still ahead of going live.

## Structure
```
astro.config.mjs        → site URL, build.format:'file' (preserves legacy /en/about.html-style
                           URLs instead of Astro's default clean-directory URLs — see note below)
vercel.json              → rewrites /en/ and /en/index.html (and /es/ equivalents) to the
                           physical en.html/es.html build output — see "Homepage URL quirk" below
src/layouts/Layout.astro → shared <head> (SEO meta, hreflang, OG, GTM, JSON-LD slot), wraps
                           Nav + page content + Footer + chat widget script
src/components/Nav.astro    → real component (not JS-injected) — EN and ES link arrays are
                              independent, edit each separately
src/components/Footer.astro → same pattern; EN has 3 columns, ES has 2 (fewer service pages)
src/styles/global.css   → Tailwind v4 CSS-first theme (@theme block = brand tokens as real
                          Tailwind colors) + legacy `--red`/`--black`/`--green`/`--oak` variable
                          aliases so ported page markup keeps working without a find-replace pass
src/pages/en/            → English pages, all with real content (index, about, digital-marketing,
                          nearshore-staffing [new], international-expansion [narrowed to the
                          Colombia-entity use case only], contact, thank-you)
src/pages/es/            → Spanish pages, all with real content (index [LatAm-first, not a
                          translation of en/index], sobre-mi, expansion-internacional [absorbed
                          the old marketing-digital.html + added market-entry marketing/events],
                          contacto, gracias)
src/pages/index.astro    → JS language-redirector (noindex,nofollow), ported from the legacy root
                          index.html — NOT a homepage, just picks /en/ or /es/ by browser language
public/assets/           → images, downloads (legacy lead-magnet HTML, unconverted), chat widget JS
public/Privacy-Policy.html, Terms-of-Service.html → legacy pages, copied as-is (unconverted —
                          still plain HTML, not yet Astro components)
```

**Homepage URL quirk:** Astro's `build.format:'file'` promotes a directory's `index.astro` up a
level (`src/pages/en/index.astro` → physical file `en.html`, not `en/index.html`) — a known Astro
behavior, not a bug in this project. Legacy canonical tags already point at `/en/` (bare, no
`index.html`) and internal links use `/en/index.html`; `vercel.json` rewrites both to the physical
`en.html` output so neither URL breaks and `/en.html` itself is never linked anywhere.

**hreflang:** only set `alternatePath` on `<Layout>` where a page genuinely has a same-content
counterpart in the other language (currently just about↔sobre-mi, contact↔contacto). Never set it
between pages with different content (e.g. the two homepages) — that would assert a translation
relationship that isn't true, which actively hurts SEO. See MARKETING.md.

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
`public/assets/js/ubik360-chat-widget.js` (unchanged from the legacy site) renders a floating chat
bubble and talks to a separate backend: `https://ubik360-bot-production.up.railway.app/chat`
(Railway-hosted bot, outside this repo). Loaded once, globally, in `Layout.astro`.

## Known fixes made during the port (don't reintroduce these bugs)
- **WhatsApp number:** the legacy `en/contact.html`/`es/contacto.html` linked a fake placeholder
  number (`wa.me/15551234567` — a 555 number, never real). Fixed to the real number
  (`wa.me/12265030456`, i.e. +1-226-503-0456) found elsewhere on the live site
  (`assets/downloads/ceo_us_university_informe_final.html`).
- **Footer email:** legacy `includes/footer.js` used `info@ubik360.com`; the real contact email
  used everywhere else on the site (including the contact page itself) is `jose@ubik360.com`.
- **Footer LinkedIn:** legacy footer had `href="#"` as a placeholder; now links to the real profile
  (`linkedin.com/in/jose-villegas-marketing-manager`).

## Hosting / deployment
Target: **Vercel**, git-push deploys from this repo (decided — see MARKETING.md). Not yet
connected/deployed as of this writing. The site was previously on Hostinger via manual file
upload — that workflow is being retired, not run in parallel.

## Known gaps / things to watch
- `public/assets/images/` has a few files with spaces in filenames (`profile pick black tie.png`,
  `profile pick short sleeve.png`) — avoid referencing new images with spaces; URL-encode existing
  ones if you link them.
- `.github/copilot-instructions.md`, `README.md`, and `WEBSITE-STRUCTURE-GUIDE.md` are leftover
  from an earlier (pre-Astro, pre-audience-model) version of the site — stale, ignore for current
  structure; update or remove them if they get more out of sync.
- `public/assets/downloads/*.html` (lead-magnet pages) and the legal pages are copied as-is,
  unconverted — still plain legacy HTML, not yet Astro components.
- No contact form backend beyond Formspree (`action="https://formspree.io/f/mlganpda"`, unchanged
  from the legacy site).

## Conventions
- When creating a new page, copy the closest already-ported page (`en/about.astro` or
  `en/contact.astro`) as a structural template — but write content for its actual audience (see
  MARKETING.md), never assume it should translate an existing page in the other language.
- Keep the legacy `var(--red)` etc. inline styles working via the alias block in `global.css`
  rather than doing a find-replace to Tailwind classes on every ported page — lower risk, and both
  compile to the same real Tailwind-generated CSS variables.
- Dynamic Tailwind class names (e.g. `` `grid-cols-${n}` ``) don't work — Tailwind's scanner needs
  literal class strings. Pick from a small set of literal options instead (see `Footer.astro`'s
  `colsClass` for the pattern).
- `@astrojs/sitemap` generates `sitemap-index.xml` automatically at build time — don't
  hand-maintain a `sitemap.xml` file.
