// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ubik360.com',
  output: 'static',
  // Preserves legacy /en/about.html-style URLs (already indexed by Google,
  // referenced in lead magnets/Calendly) instead of Astro's default
  // clean-directory URLs. src/pages/en/about.astro -> /en/about.html
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});