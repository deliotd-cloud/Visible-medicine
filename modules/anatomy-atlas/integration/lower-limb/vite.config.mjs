import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { moduleAudit } from '../module-audit.mjs';
const root = fileURLToPath(new URL('../../',import.meta.url));
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
export default defineConfig({
  define:{__VM_SPECIMEN_SOURCE_REVISION__:JSON.stringify(sourceCommit)},
  root:fileURLToPath(new URL('./',import.meta.url)),
  base:'/atlas-runtime/lower-limb/', publicDir:false,
  resolve:{alias:{'@':root}},
  css:{postcss:{plugins:[tailwind({base:root})]}},
  plugins:[react(),{
    name:'specimen-selection-proof',
    generateBundle(){this.emitFile({type:'asset',fileName:'specimen-channel.json',source:JSON.stringify({version:1,sourceCommit})+'\n'});},
  },moduleAudit(root,['integration/lower-limb/vite.config.mjs','integration/lower-limb/index.html','scripts/export-lower-limb-module.mjs','scripts/export-space-preflight.mjs'])],
  build:{outDir:'../../.sites-runtime/lower-limb-module',emptyOutDir:true,sourcemap:false},
});
