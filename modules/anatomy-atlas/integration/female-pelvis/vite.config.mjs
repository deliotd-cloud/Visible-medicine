import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { moduleAudit } from '../module-audit.mjs';
const root = fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL('./',import.meta.url)),
  base:'/atlas-runtime/female-pelvis/', publicDir:false,
  resolve:{alias:{'@':root}},
  css:{postcss:{plugins:[tailwind({base:root})]}},
  plugins:[react(),moduleAudit(root,['integration/female-pelvis/vite.config.mjs','integration/female-pelvis/index.html'])],
  build:{outDir:'../../.sites-runtime/female-pelvis-module',emptyOutDir:true,sourcemap:false},
});
