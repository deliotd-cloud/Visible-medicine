import { readFile, writeFile, mkdir, copyFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !target.replaceAll('\\','/').endsWith('/public/atlas-runtime/lower-limb')) throw Error('Choose an explicit website public/atlas-runtime/lower-limb destination');
try { await lstat(target); throw Error('Destination exists; preserve it before exporting'); } catch(e) { if (e.code !== 'ENOENT') throw e; }
if (execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()) throw Error('Commit and verify the Atlas before exporting');
const sourceCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const build = join(root,'.sites-runtime/lower-limb-module');
const inputs = JSON.parse(await readFile(join(build,'source-inputs.json'),'utf8'));
for (const input of inputs) {
  if (input.path.includes('..') || input.path.startsWith('/') || input.path.includes(':') || input.path.includes('\\')) throw Error('Unsafe input');
  if (hash(await readFile(join(root,input.path))) !== input.sha256) throw Error('Stale build: '+input.path);
}
const generated = ['index.html','BUNDLED_NOTICES.txt','bundled-dependencies.json','source-inputs.json',...(await readdir(join(build,'assets'))).map(n=>'assets/'+n)];
if (generated.some(n=> !/^(?:index\.html|BUNDLED_NOTICES\.txt|(?:bundled-dependencies|source-inputs)\.json|assets\/[a-zA-Z0-9_.-]+\.(?:js|css))$/.test(n))) throw Error('Unexpected generated file');
const copies = generated.map(n=>[join(build,n),n]);
const kneeBytes = await readFile(join(root,'public/models/um-knee/catalog.json'));
const knee = JSON.parse(kneeBytes), limb = JSON.parse(await readFile(join(root,'public/models/um-limb/catalog.json'),'utf8'));
if (knee.structures.length !== 15 || limb.structures.length !== 52 || limb.bundles.length !== 4
  || limb.companionKneeCatalogSha256 !== hash(kneeBytes)
  || [knee,limb].some(c => c.source.license !== 'CC0-1.0' || c.source.version !== '1.2' || c.registeredToBodyParts3D !== false || c.imagingRegistration !== null)) throw Error('Re-audit changed source scope');
for (const bundle of [knee.bundle,...limb.bundles]) {
  if (!/^\/models\/um-(?:limb|knee)\/[a-z-]+\.glb$/.test(bundle.url)) throw Error('Unexpected model path');
  const path = bundle.url.slice(1), file = join(root,'public',path), bytes = await readFile(file);
  if (hash(bytes) !== bundle.sha256 || bytes.length !== bundle.bytes) throw Error('Model integrity failure');
  copies.push([file,path]);
}
for (const path of ['models/um-knee/catalog.json','models/um-limb/catalog.json']) copies.push([join(root,'public',path),path]);
for (const path of ['LICENSE','LICENSES/THIRD_PARTY_NOTICES.md','LICENSES/um-lower-limb-v1-2/readme.txt','LICENSES/um-lower-limb-v1-2/dataverse.json']) copies.push([join(root,path),path]);
copies.push([join(root,'integration/lower-limb/MODEL_NOTICE.md'),'MODEL_NOTICE.md']);
const records = [];
for (const [from,name] of copies) {
  if (!(await lstat(from)).isFile()) throw Error('Regular files only');
  const bytes = await readFile(from), to = join(target,name);
  if (relative(target,to).startsWith('..')) throw Error('Unsafe output');
  await mkdir(resolve(to,'..'),{recursive:true}); await copyFile(from,to);
  records.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
}
await writeFile(join(target,'manifest.json'),JSON.stringify({
  schemaVersion:1,sourceCommit,region:'independent-right-lower-limb',structures:67,
  scopes:5,studies:26,draftTeachingSelections:67,clinicalDraftSelections:65,
  patientDataIncluded:false,clinicalApproved:false,standaloneReviewConnection:false,imagingConnection:false,files:records,
},null,2)+'\n');
console.log(JSON.stringify({sourceCommit,files:records.length,bytes:records.reduce((n,f)=>n+f.bytes,0),patientDataIncluded:false}));
