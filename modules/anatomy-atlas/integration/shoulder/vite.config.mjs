import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: '/atlas-runtime/shoulder/',
  publicDir: false,
  resolve: { alias: { '@': root } },
  css: { postcss: { plugins: [tailwind({ base: root })] } },
  plugins: [react(), {
    name: 'shoulder-framework-boundary',
    resolveId(id) { if (['next/link','next/image','next/dynamic'].includes(id)) return '\0shoulder-' + id; },
    load(id) {
      if (!id.startsWith('\0shoulder-next/')) return;
      const symbol = { link:'Link', image:'Image', dynamic:'dynamic' }[id.split('/').at(-1)];
      return `export { ${symbol} as default } from ${JSON.stringify(fileURLToPath(new URL('./framework.tsx', import.meta.url)))};`;
    },
  }, {
    name: 'bundled-commercial-notices',
    async generateBundle(_options,bundle) {
      const packages=new Map();
      for(const chunk of Object.values(bundle)) {
        if(chunk.type!=='chunk') continue;
        for(const [id,module] of Object.entries(chunk.modules)) {
          if(!id.includes('node_modules') || module.renderedLength===0) continue;
          let directory=dirname(id.split('?')[0]);
          while(directory.includes('node_modules')) {
            try {
              const pkg=JSON.parse(await readFile(join(directory,'package.json'),'utf8'));
              if(!pkg.name || !pkg.version) { directory=dirname(directory); continue; }
              if(packages.has(pkg.name+'@'+pkg.version)) break;
              if(!['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','CC0-1.0','0BSD'].includes(pkg.license)) throw Error('Bundle licence needs review: '+pkg.name+' '+pkg.license);
              const names=(await readdir(directory)).filter(n=>/^(licen[cs]e|copying|notice)([.-]|$)/i.test(n));
              const texts=await Promise.all(names.map(async n=>n+'\n'+await readFile(join(directory,n),'utf8')));
              if(!texts.length && pkg.name==='@react-three/fiber' && pkg.version==='9.7.0') texts.push('https://raw.githubusercontent.com/pmndrs/react-three-fiber/v9.7.0/LICENSE\n'+await readFile(join(root,'LICENSES/react-three-fiber-9.7.0-MIT.txt'),'utf8'));
              if(!texts.length) throw Error('Missing licence text: '+pkg.name);
              packages.set(pkg.name+'@'+pkg.version,{name:pkg.name,version:pkg.version,license:pkg.license,text:texts.join('\n\n')}); break;
            } catch(error) { if(error.code!=='ENOENT') throw error; directory=dirname(directory); }
          }
        }
      }
      const records=[...packages.values()].sort((a,b)=>a.name.localeCompare(b.name));
      const inputs=new Set(['package-lock.json','integration/shoulder/vite.config.mjs','integration/shoulder/index.html']);
      for(const id of this.getModuleIds()) {
        if(id.includes('node_modules') || id.startsWith('\0')) continue;
        const path=relative(root,id.split('?')[0]).replaceAll('\\','/');
        if(!path.startsWith('..') && /\.(ts|tsx|mjs|cjs|jsx|js|json|css)$/.test(path)) inputs.add(path);
      }
      const inputRecords=await Promise.all([...inputs].sort().map(async path=>({path,sha256:createHash('sha256').update(await readFile(join(root,path))).digest('hex')})));
      this.emitFile({type:'asset',fileName:'source-inputs.json',source:JSON.stringify(inputRecords,null,2)+'\n'});
      this.emitFile({type:'asset',fileName:'bundled-dependencies.json',source:JSON.stringify(records.map(({text,...rest})=>rest),null,2)+'\n'});
      this.emitFile({type:'asset',fileName:'BUNDLED_NOTICES.txt',source:records.map(p=>p.name+'@'+p.version+' ('+p.license+')\n'+p.text).join('\n\n----------------\n\n')});
    },
  }],
  build: { outDir: '../../.sites-runtime/shoulder-module', emptyOutDir: true, sourcemap: false },
});
