import { defineConfig } from 'vite';

// GitHub Pages serves the site from https://<user>.github.io/<repo>/
// so assets must be loaded from /<repo>/. The workflow sets BASE_PATH;
// locally (npm run dev) it falls back to '/'.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
});
