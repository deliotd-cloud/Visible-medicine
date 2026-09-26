import { readFile, writeFile, mkdir, copyFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { assertExportSpace } from './export-space-preflight.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
const target = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !target.replaceAll('\\','/').endsWith('/public/atlas-runtime/female-pelvis')) throw Error('Choose an explicit website public/atlas-runtime/female-pelvis destination');
try { await lstat(target); throw Error('Destination exists; preserve it before creating a new export'); } catch (e) { if(e.code !== 'ENOENT') throw e; }
if (execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()) throw Error('Commit and verify the Atlas before exporting');
const sourceCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const build = join(root,'.sites-runtime/female-pelvis-module');
const inputs = JSON.parse(await readFile(join(build,'source-inputs.json'),'utf8'));
for(const path of ['scripts/export-female-pelvis-module.mjs','scripts/export-space-preflight.mjs'])
  if(!inputs.some(i=>i.path===path))throw Error('Missing export source binding: '+path);
for (const input of inputs) {
  if (input.path.includes('..') || input.path.startsWith('/') || input.path.includes(':') || input.path.includes('\\')) throw Error('Unsafe input record');
  if (hash(await readFile(join(root,input.path))) !== input.sha256) throw Error('Stale module build: ' + input.path);
}
const generated = ['index.html','BUNDLED_NOTICES.txt','bundled-dependencies.json','source-inputs.json',...(await readdir(join(build,'assets'))).map(n=>'assets/'+n)];
if (generated.some(n=> !/^(?:index\.html|BUNDLED_NOTICES\.txt|(?:bundled-dependencies|source-inputs)\.json|assets\/[a-zA-Z0-9_.-]+\.(?:js|css))$/.test(n))) throw Error('Unexpected generated file');
const copies = generated.map(n=>[join(build,n),n]);
const raw = JSON.parse(await readFile(join(root,'public/models/hra-pelvis/catalog.json'),'utf8'));
if (raw.structures.length !== 41 || raw.bundles.length !== 1 || raw.clinicalApproval !== false) throw Error('Re-audit changed source scope');
if (hash(await readFile(join(root,'public/models/hra-pelvis/pelvis.glb'))) !== raw.bundles[0].sha256) throw Error('Model integrity failure');
for (const path of ['models/hra-pelvis/pelvis.glb','models/hra-pelvis/catalog.json','models/hra-pelvis/NOTICE.md']) copies.push([join(root,'public',path),path]);
const renal = JSON.parse(await readFile(join(root,'public/models/hra-renal/catalog.json'),'utf8'));
if (renal.structures.length !== 82 || renal.bundles.length !== 1 || renal.clinicalApproval !== false
  || renal.source.sha256 !== raw.source.sha256 || renal.sourceFrame !== raw.sourceFrame
  || JSON.stringify(renal.displayTransformColumnMajor) !== JSON.stringify(raw.displayTransformColumnMajor)) throw Error('Re-audit changed urinary context source/frame');
if (hash(await readFile(join(root,'public/models/hra-renal/kidneys.glb'))) !== renal.bundles[0].sha256) throw Error('Ureter bundle integrity failure');
const ureters = renal.structures.filter(s=>['VH_F_right_ureter','VH_F_left_ureter'].includes(s.sourceName));
if (ureters.length !== 2 || new Set(ureters.map(s=>s.id)).size !== 2) throw Error('Unexpected exposed urinary context');
for (const path of ['models/hra-renal/kidneys.glb','models/hra-renal/catalog.json','models/hra-renal/NOTICE.md']) copies.push([join(root,'public',path),path]);
for (const path of ['LICENSE','LICENSES/THIRD_PARTY_NOTICES.md','LICENSES/CC-BY-4.0.txt']) copies.push([join(root,path),path]);
await assertExportSpace(target,copies);
const records = [];
for (const [from,name] of copies) {
  if (!(await lstat(from)).isFile()) throw Error('Regular files only');
  const bytes = await readFile(from), to = join(target,name);
  if (relative(target,to).startsWith('..')) throw Error('Unsafe output');
  await mkdir(resolve(to,'..'),{recursive:true}); await copyFile(from,to);
  records.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
}
await writeFile(join(target,'manifest.json'),JSON.stringify({
  schemaVersion:1,sourceCommit,region:'independent-female-pelvis',structures:43,
  nativePelvicSelections:41,reusedRenalSelections:2,studies:11,draftTeachingSelections:43,patientDataIncluded:false,clinicalApproved:false,
  exposedStructureIds:[...raw.structures,...ureters].map(s=>s.id),
  reusedRenalSourceIds:ureters.map(s=>s.id),
  renalBundleSelections:82,otherRenalSelectionsSelectableInPelvicUI:false,
  fullRenalBundleAndCatalogIncluded:true,
  standaloneReviewConnection:false,imagingConnection:false,files:records,
},null,2)+'\n');
console.log(JSON.stringify({sourceCommit,files:records.length,bytes:records.reduce((n,f)=>n+f.bytes,0),patientDataIncluded:false}));
