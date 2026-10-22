import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'always',
  compressHTML: false,
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
