import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import {execFileSync} from 'node:child_process';

function teachingGraph(root,bundle) {
  const chunks=Object.values(bundle).filter(chunk=>chunk.type==='chunk');
  const regions=[],fallback=[];
  for(const chunk of chunks)for(const id of Object.keys(chunk.modules)) {
    const path=relative(root,id.split('?')[0]).replaceAll('\\','/');
    const match=/^content\/regional-teaching\/([a-z-]+)\.json$/.exec(path);
    if(match)regions.push({region:match[1],path:chunk.fileName});
    if(path==='app/body-content.ts')fallback.push(chunk.fileName);
  }
  return {schemaVersion:1,regions,fallback,chunks:chunks.map(chunk=>({
    path:chunk.fileName,imports:chunk.imports,dynamicImports:chunk.dynamicImports,
    sha256:createHash('sha256').update(chunk.code).digest('hex'),
  }))};
}

// Audit what actually reaches the browser, with full notices and reproducible inputs.
export function moduleAudit(root, extraInputs) {
  return {
    name: 'regional-module-commercial-notices',
    buildStart() {
      // All four learner exports refuse stale derived teaching. This checks the
      // entire original resolver, including display corrections and undefined
      // optional fields; builds do not silently rewrite committed snapshots.
      execFileSync(process.execPath, ['scripts/regional-teaching-snapshots.mjs', '--check'],
        {cwd:root, windowsHide:true, maxBuffer:2_000_000});
    },
    writeBundle: {
      order:'post',
      async handler(options,bundle) {
        // Vite resolves preload references after generateBundle. Bind the graph
        // to final bytes on disk, never its earlier placeholder-bearing code.
        const path=join(options.dir,'teaching-chunks.json');
        const report=teachingGraph(root,bundle);
        for(const chunk of report.chunks)
          chunk.sha256=createHash('sha256').update(await readFile(join(options.dir,chunk.path))).digest('hex');
        await writeFile(path,JSON.stringify(report,null,2)+'\n');
      },
    },
    async generateBundle(_options, bundle) {
      const packages = new Map();
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const [id, module] of Object.entries(chunk.modules)) {
          if (!id.includes('node_modules') || module.renderedLength === 0) continue;
          let directory = dirname(id.split('?')[0]);
          while (directory.includes('node_modules')) {
            try {
              const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
              if (!pkg.name || !pkg.version) { directory = dirname(directory); continue; }
              if (packages.has(pkg.name + '@' + pkg.version)) break;
              if (!['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','CC0-1.0','0BSD'].includes(pkg.license)) throw Error('Bundle licence needs review: ' + pkg.name + ' ' + pkg.license);
              const names = (await readdir(directory)).filter(n => /^(licen[cs]e|copying|notice)([.-]|$)/i.test(n));
              const texts = await Promise.all(names.map(async n => n + '\n' + await readFile(join(directory,n),'utf8')));
              if (!texts.length && pkg.name === '@react-three/fiber' && pkg.version === '9.7.0') texts.push('https://raw.githubusercontent.com/pmndrs/react-three-fiber/v9.7.0/LICENSE\n' + await readFile(join(root,'LICENSES/react-three-fiber-9.7.0-MIT.txt'),'utf8'));
              if (!texts.length) throw Error('Missing licence text: ' + pkg.name);
              packages.set(pkg.name + '@' + pkg.version, { name:pkg.name, version:pkg.version, license:pkg.license, text:texts.join('\n\n') });
              break;
            } catch (error) { if (error.code !== 'ENOENT') throw error; directory = dirname(directory); }
          }
        }
      }
      const records = [...packages.values()].sort((a,b) => a.name.localeCompare(b.name));
      this.emitFile({type:'asset',fileName:'teaching-chunks.json',source:JSON.stringify(teachingGraph(root,bundle),null,2)+'\n'});
      const inputs = new Set(['package-lock.json','integration/module-audit.mjs','scripts/regional-teaching-snapshots.mjs',...extraInputs]);
      for (const id of this.getModuleIds()) {
        if (id.includes('node_modules') || id.startsWith('\0')) continue;
        const path = relative(root,id.split('?')[0]).replaceAll('\\','/');
        if (!path.startsWith('..') && /\.(ts|tsx|mjs|js|json|css)$/.test(path)) inputs.add(path);
      }
      const inputRecords = await Promise.all([...inputs].sort().map(async path => ({ path, sha256:createHash('sha256').update(await readFile(join(root,path))).digest('hex') })));
      this.emitFile({type:'asset',fileName:'source-inputs.json',source:JSON.stringify(inputRecords,null,2)+'\n'});
      this.emitFile({type:'asset',fileName:'bundled-dependencies.json',source:JSON.stringify(records.map(({text,...rest})=>rest),null,2)+'\n'});
      this.emitFile({type:'asset',fileName:'BUNDLED_NOTICES.txt',source:records.map(p=>p.name+'@'+p.version+' ('+p.license+')\n'+p.text).join('\n\n----------------\n\n')});
    },
  };
}
