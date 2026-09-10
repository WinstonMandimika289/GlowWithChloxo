// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Old URLs from the previous site → new pages (paths are case-sensitive).
const legacyRedirects = {
  '/index.html': '/',
  '/facial.html': '/treatments',
  '/Nails.html': '/nails',
  '/nails.html': '/nails',
  '/ANails.html': '/nails',
  '/FaceBoosters.html': '/skin-boosters',
  '/price.html': '/prices',
  '/contact.html': '/contact',
  '/Profhilo.html': '/treatments/profhilo',
  '/MiniFacial.html': '/treatments/luxury-mini-facial',
  '/Mesotherapy.html': '/treatments/mesotherapy',
  '/MesoDeluxe.html': '/treatments/deluxe-mesotherapy',
  '/Dermaplaning.html': '/treatments/dermaplaning',
  '/DermaDulxe.html': '/treatments/deluxe-dermaplaning',
  '/MesoNDerma.html': '/treatments/mesotherapy-dermaplaning',
  '/DeluxeDM.html': '/treatments/deluxe-mesotherapy-dermaplaning',
  '/Deluxe1.html': '/skin-boosters',
  '/Deluxe2.html': '/skin-boosters',
  '/property-details.html': '/',
};

// DEPLOY_TARGET=static builds plain HTML for static hosts (e.g. GitHub Pages);
// the chat endpoint is then provided by worker/groq-proxy.js instead.
const isStaticDeploy = process.env.DEPLOY_TARGET === 'static';

export default defineConfig({
  site: 'https://glow-with-chlo.com',
  output: 'static',
  adapter: isStaticDeploy ? undefined : node({ mode: 'standalone' }),
  // Astro 7 defaults to JSX-style whitespace; keep HTML semantics.
  compressHTML: true,
  redirects: legacyRedirects,
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  env: {
    schema: {
      GROQ_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GROQ_MODEL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  server: { port: 4321 },
});
