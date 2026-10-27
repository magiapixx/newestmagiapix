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
  vite: {
    resolve: {
      // three's WebGPU build contains its whole core: point the loaders' `three` imports at it so it ships once
      alias: [{ find: /^three$/, replacement: 'three/webgpu' }],
    },
  },
});
