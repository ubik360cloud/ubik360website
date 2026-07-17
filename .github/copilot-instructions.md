# GitHub Copilot Workspace Instructions

## About this project
This repository is a small static bilingual website for Ubik 360 Enterprises. It is built with plain HTML, CSS, and JavaScript. The English site under `/en/` is complete, while the Spanish site under `/es/` is partially created and needs content/page completion.

## Key files and folders
- `index.html` — Spanish homepage (root default)
- `en/` — English site pages (complete)
- `es/` — Spanish site pages (partial; new pages need to be created)
- `assets/css/main.css` — site styles and design tokens
- `assets/js/main.js` — navigation and interactive behavior
- `README.md` — deployment and project overview
- `WEBSITE-STRUCTURE-GUIDE.md` — page structure, missing Spanish pages, and translation guidance

## What Copilot should do here
- Prefer editing existing HTML and CSS over adding new frameworks or dependencies.
- Keep the site static and lightweight; do not introduce Node tooling or build systems.
- When translating or creating Spanish pages, preserve HTML structure and CSS classes.
- Update internal navigation links for Spanish pages to use the correct `/es/` paths.
- Keep language toggle logic and `hreflang`/meta tags consistent between English and Spanish pages.
- Use the `README.md` and `WEBSITE-STRUCTURE-GUIDE.md` as canonical references for site structure, deployment, and translation tasks.

## What to avoid
- Do not remove or rewrite all HTML files; make targeted content and link fixes.
- Do not add a backend, package manager, or build process.
- Do not translate code, class names, or IDs; translate only visible text and metadata.
- Do not assume additional localization beyond the existing English/Spanish structure.

## Common tasks for this workspace
- Create missing Spanish pages under `/es/` by copying the corresponding English page from `/en/` and translating text.
- Fix navigation and footer links so Spanish page URLs point to `/es/...` and English pages remain under `/en/...`.
- Update asset references only as needed (images, PDF links, etc.).
- Adjust the design in `assets/css/main.css` if layout or color updates are requested.
- Add or improve SEO metadata, title tags, and language attributes on HTML pages.

## Useful workspace context
- The Spanish site uses a different root structure than the English site; `/` is the Spanish homepage, `/en/` is English.
- Only the English pages are fully complete; `WEBSITE-STRUCTURE-GUIDE.md` lists the exact Spanish pages still to create.
- There is no build or deployment automation in the repository; edits should result in ready-to-upload static files.

## Example prompts
- "Create the missing Spanish page `/es/servicios/marketing-crecimiento.html` from the English template and update navigation links."
- "Translate `/en/faq-international.html` into Spanish and add it as `/es/faq-internacional.html`."
- "Fix the Spanish language toggle links so they point to the correct `/es/` pages."
- "Update the site color palette in `assets/css/main.css` to use a darker blue and brighter orange."
