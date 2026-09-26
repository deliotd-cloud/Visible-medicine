import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { moduleAudit } from '../module-audit.mjs';
const root = fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({
  root:fileURLToPath(new URL('./',import.meta.url)),
  base:'/atlas-runtime/lower-limb/', publicDir:false,
  resolve:{alias:{'@':root}},
  css:{postcss:{plugins:[tailwind({base:root})]}},
  plugins:[react(),moduleAudit(root,['integration/lower-limb/vite.config.mjs','integration/lower-limb/index.html','scripts/export-lower-limb-module.mjs','scripts/export-space-preflight.mjs'])],
  build:{outDir:'../../.sites-runtime/lower-limb-module',emptyOutDir:true,sourcemap:false},
});
