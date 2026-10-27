import { defineConfig } from 'astro/config';
import cssPrune from './tools/css-prune.mjs';

export default defineConfig({
  integrations: [cssPrune()],
  trailingSlash: 'always',
  // the contact page now lives on the about page
  redirects: {
    '/contact/': '/about/#contact',
  },
  compressHTML: false,
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
