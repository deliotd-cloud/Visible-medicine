import {defineConfig} from 'vite';
import {execFileSync} from 'node:child_process';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
import {moduleAudit} from '../module-audit.mjs';
import {regionalCompanions} from './companions.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
export default defineConfig({
  define:{__VM_HEAD_SOURCE_REVISION__:JSON.stringify(sourceCommit)},
  root:fileURLToPath(new URL('./',import.meta.url)),base:'/atlas-runtime/head-neck/',publicDir:false,
  resolve:{alias:{'@':root},dedupe:['three']},css:{postcss:{plugins:[tailwind({base:root})]}},
  plugins:[react(),{
    name:'head-neck-framework-boundary',
    generateBundle(){this.emitFile({type:'asset',fileName:'selection-channel.json',source:JSON.stringify({version:1,sourceCommit})+'\n'});},
    resolveId(id){if(['next/link','next/image','next/dynamic'].includes(id))return '\0head-neck-'+id;},
    load(id){
      if(!id.startsWith('\0head-neck-next/'))return;
      const symbol={link:'Link',image:'Image',dynamic:'dynamic'}[id.split('/').at(-1)];
      return 'export { '+symbol+' as default } from '+JSON.stringify(fileURLToPath(new URL('./framework.tsx',import.meta.url)))+';';
    },
  },moduleAudit(root,['integration/head-neck/vite.config.mjs','integration/head-neck/index.html','integration/head-neck/delivery.ts','integration/head-neck/companions.mjs','scripts/head-neck-module-inputs.mjs','scripts/independent-source-contract.mjs','scripts/export-head-neck-module.mjs','scripts/export-space-preflight.mjs',...regionalCompanions.map(([source])=>source)])],
  build:{outDir:'../../.sites-runtime/head-neck-module',emptyOutDir:true,sourcemap:false},
});
