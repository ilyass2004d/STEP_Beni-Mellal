import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Link previews (WhatsApp, LinkedIn, Facebook…) need absolute URLs, so og:image and
 * og:url are only added when the public address is known: SITE_URL=https://… at build.
 */
function socialMeta(siteUrl?: string): Plugin {
  const site = siteUrl?.replace(/\/+$/, '');
  return {
    name: 'social-meta',
    transformIndexHtml: () =>
      site
        ? [
            { tag: 'meta', attrs: { property: 'og:url', content: `${site}/` }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og-image.jpg` }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: `${site}/og-image.jpg` }, injectTo: 'head' },
          ]
        : [],
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), socialMeta(loadEnv(mode, '.', 'SITE_').SITE_URL)],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
}));
