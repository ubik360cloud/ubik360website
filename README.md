# Ubik 360 Website

Bilingual (EN/ES) marketing site for Ubik 360, built with [Astro](https://astro.build) (static
output) and deployed on Vercel. Live at [ubik360.com](https://ubik360.com).

For everything about this project — site structure, dev conventions, brand voice, positioning,
audience, and the state of in-progress work — see:

- **[CLAUDE.md](./CLAUDE.md)** — site structure, conventions, hosting/deployment, known gaps
- **[MARKETING.md](./MARKETING.md)** — brand voice, messaging, audience/ICP, marketing backend plan

## Local development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (verify before deploying)
```

`git push` to `astro-migration` deploys straight to production (see CLAUDE.md "Hosting /
deployment").
