// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Old URLs from the previous site → new pages (paths are case-sensitive).
const legacyRedirects = {
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

// Static hosts can't send 301s, so write a flat `old-page.html` file per legacy URL
// that forwards instantly (Astro's own static redirects become `old-page.html/index.html`).
const legacyHtmlRedirects = {
  name: 'legacy-html-redirects',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const { writeFile } = await import('node:fs/promises');
      for (const [from, to] of Object.entries(legacyRedirects)) {
        const html =
          `<!doctype html><html lang="en-GB"><meta charset="utf-8"><title>Redirecting…</title>` +
          `<meta name="robots" content="noindex"><link rel="canonical" href="https://glow-with-chlo.com${to}">` +
          `<meta http-equiv="refresh" content="0;url=${to}">` +
          `<script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script>` +
          `<p><a href="${to}">Continue to the new page</a></p></html>`;
        await writeFile(new URL(from.slice(1), dir), html);
      }
    },
  },
};

export default defineConfig({
  site: 'https://glow-with-chlo.com',
  output: 'static',
  adapter: isStaticDeploy ? undefined : node({ mode: 'standalone' }),
  // Astro 7 defaults to JSX-style whitespace; keep HTML semantics.
  compressHTML: true,
  // Node server: real 301s. Static hosting: flat forwarding files (see above).
  redirects: isStaticDeploy ? {} : legacyRedirects,
  integrations: [sitemap(), ...(isStaticDeploy ? [legacyHtmlRedirects] : [])],
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
