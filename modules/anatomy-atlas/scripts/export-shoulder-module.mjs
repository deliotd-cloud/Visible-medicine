import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { assertExportSpace } from './export-space-preflight.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const target=resolve(process.argv[2] ?? '');
if (!process.argv[2] || !target.replaceAll('\\','/').endsWith('/public/atlas-runtime/shoulder')) throw Error('Choose the explicit website public/atlas-runtime/shoulder destination');
try { await stat(target); throw Error('Destination exists; preserve it and choose a clean checkout for a new export'); } catch(e) { if(e.code!=='ENOENT') throw e; }
if(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()) throw Error('Commit and verify the atlas before exporting');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const build=join(root,'.sites-runtime/shoulder-module');
const inputs=JSON.parse(await readFile(join(build,'source-inputs.json'),'utf8'));
for(const path of ['scripts/export-shoulder-module.mjs','scripts/export-space-preflight.mjs'])
  if(!inputs.some(i=>i.path===path))throw Error('Missing export source binding: '+path);
for (const required of ['integration/shoulder/vite.config.mjs','app/anatomy-scene.tsx','app/fitted-camera.tsx','lib/explode-layout.mjs']) {
  if (!inputs.some(input => input.path === required)) throw Error('Incomplete module source manifest: ' + required);
}
for(const input of inputs) {
  if(input.path.includes('..') || input.path.startsWith('/') || input.path.includes(':')) throw Error('Unsafe input record');
  if(hash(await readFile(join(root,input.path)))!==input.sha256) throw Error('Stale module build: '+input.path);
}
const files=['index.html','BUNDLED_NOTICES.txt','bundled-dependencies.json','source-inputs.json', ...(await readdir(join(build,'assets'))).map(n=>'assets/'+n)];
if(files.some(n=>!/^index\.html$|^BUNDLED_NOTICES\.txt$|^(bundled-dependencies|source-inputs)\.json$|^assets\/[a-zA-Z0-9_.-]+\.(js|css)$/.test(n))) throw Error('Unexpected generated file');
const copies=files.map(n=>[join(build,n),n]);
for(const path of ['models/bodyparts3d/shoulder-right.glb','models/bodyparts3d/manifest.json']) copies.push([join(root,'public',path),path]);
copies.push([join(root,'integration/shoulder/credits.html'),'models/bodyparts3d/credits.html']);
for(const path of ['LICENSE','LICENSES/THIRD_PARTY_NOTICES.md','LICENSES/dependency-license-audit.json','LICENSES/CC-BY-4.0.txt','LICENSES/BODYPARTS3D.md']) copies.push([join(root,path),path]);
const manifest=JSON.parse(await readFile(join(root,'public/models/bodyparts3d/manifest.json'),'utf8'));
if(hash(await readFile(join(root,'public/models/bodyparts3d/shoulder-right.glb')))!==manifest.sha256) throw Error('Model integrity failure');
await assertExportSpace(target,copies);
const records=[];
for(const [from,name] of copies){
  const bytes=await readFile(from); const to=join(target,name);
  if(relative(target,to).startsWith('..')) throw Error('Unsafe output');
  await mkdir(resolve(to,'..'),{recursive:true}); await copyFile(from,to);
  records.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
}
await writeFile(join(target,'manifest.json'),JSON.stringify({schemaVersion:1,sourceCommit,region:'shoulder-right',structures:9,patientDataIncluded:false,clinicalApproved:false,standaloneReviewConnection:false,files:records},null,2)+'\n');
console.log(JSON.stringify({sourceCommit,files:records.length,bytes:records.reduce((n,f)=>n+f.bytes,0),patientDataIncluded:false}));
