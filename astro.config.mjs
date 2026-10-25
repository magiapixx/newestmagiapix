import { defineConfig } from 'astro/config';
import cssPrune from './tools/css-prune.mjs';

export default defineConfig({
  integrations: [cssPrune()],
  trailingSlash: 'always',
  compressHTML: false,
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
