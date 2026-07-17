# Ubik 360 Website — CLAUDE.md

> For brand voice, messaging guidelines, audience/ICP, and the marketing backend plan, see
> [MARKETING.md](./MARKETING.md). This file covers site structure and dev conventions only.

## What this is
Bilingual (EN/ES) static marketing website for **Ubik 360**, José Villegas's
consultancy. Two service tracks:
- **Digital Marketing** — growth marketing / fractional CMO for Hispanic
  businesses in the US & Canada.
- **International Expansion** — market entry between Colombia, the US, and
  Canada.

Plain HTML/CSS/JS, no build step, no framework, no package manager. Deployed
as static files (currently Hostinger; see "Hosting" below). Repo:
https://github.com/ubik360cloud/ubik360website

**Do not introduce a build system, bundler, or JS framework** unless
explicitly asked — the site's simplicity is intentional.

## Structure
```
index.html             → JS language-redirector only (noindex,nofollow; detects navigator.language,
                          replaces to /es/ or /en/). NOT the Spanish homepage — that's es/index.html.
en/                    → English pages (index, about, contact, digital-marketing,
                          international-expansion, thank-you, thank-you-expansion)
es/                    → Spanish pages (index, sobre-mi, contacto, marketing-digital,
                          expansion-internacional, gracias, gracias-checklist)
assets/css/main.css    → single stylesheet, brand tokens at the top
assets/js/main.js      → page interactions
assets/js/ubik360-chat-widget.js → floating chat widget (see "Chat widget")
assets/images/         → photos, logo, favicons
assets/downloads/      → gated lead-magnet HTML pages (checklists/reports)
includes/nav.js        → injects the nav bar into a `<div id="site-nav">` on every page
includes/footer.js     → injects the footer the same way
Privacy-Policy.html, Terms-of-Service.html → legal, root-level, not localized
robots.txt, sitemap.xml, google*.html      → SEO / search console verification
.htaccess              → Apache caching/compression rules (Hostinger-specific)
```

EN and ES are **not directory mirrors** — file names differ per language
(e.g. `en/digital-marketing.html` ↔ `es/marketing-digital.html`). The
EN↔ES toggle mapping lives in `includes/nav.js` (`links` arrays) — if you
add/rename a page, update that mapping and the equivalent page's `hreflang`
tags together, or the language toggle will 404.

## Brand tokens (`assets/css/main.css`)
```
--red:   #931F1D   /* CTAs, buttons */
--black: #050505   /* text, dark sections */
--green: #659157   /* accents, section tags */
--oak:   #CEC5B5   /* light section backgrounds */
```
Headings use `DM Serif Display`; body text uses `Inter`. (Older docs in this
repo mention a blue/orange/teal palette — that's stale, ignore it. The red/
black/green/oak system above is what's live on every page.)

## Shared nav/footer pattern
Every page includes `<div id="site-nav"></div>` and a footer equivalent,
then loads `includes/nav.js` / `includes/footer.js`, which inject markup via
`innerHTML` (inline styles, not CSS classes) and detect language from the
URL path (`/en/` vs everything else = Spanish). When editing nav/footer,
edit these two JS files once — not each HTML page.

## Chat widget
`assets/js/ubik360-chat-widget.js` renders a floating chat bubble and talks
to a separate backend: `https://ubik360-bot-production.up.railway.app/chat`
(Railway-hosted bot, outside this repo). Language of greeting/prompts is
inferred from `navigator.language`, independent of which EN/ES page it's on.

## Hosting / deployment
Currently deployed via Hostinger (File Manager / FTP upload of these static
files — see `.htaccess` for the Apache caching rules Hostinger uses). This
repo is the source of truth going forward; changes still need to be
uploaded to Hostinger to go live unless/until we move deployment (e.g. to
Cloudflare Pages/Vercel) — ask before assuming a hosting migration is in
scope.

## Known gaps / things to watch
- `assets/images/` has a few files with spaces in filenames (`profile pick
  black tie.png`, `profile pick short sleeve.png`) — avoid referencing new
  images with spaces; URL-encode existing ones if you link them.
- `.github/copilot-instructions.md`, `README.md`, and
  `WEBSITE-STRUCTURE-GUIDE.md` are leftover from an earlier version of the
  site (they describe a `/services/`, `/case-studies/` subfolder structure
  and a blue/orange palette that no longer exist). Prefer this file over
  those for current structure; update or remove them if they get more out
  of sync.
- No contact form backend visible in this repo — contact pages likely rely
  on Calendly (`https://calendly.com/jose-ubik360/30min`) and/or the chat
  widget.

## Conventions
- Keep pages static HTML; don't add Node tooling.
- When creating a new page, copy the closest existing page as a template to
  keep nav/footer includes, meta tags, and hreflang structure consistent.
- Translate visible text only — keep HTML structure, CSS classes/IDs, and
  file organization pattern (inline-style nav/footer) unchanged between EN
  and ES.
- Keep `sitemap.xml` in sync when adding/removing pages.
