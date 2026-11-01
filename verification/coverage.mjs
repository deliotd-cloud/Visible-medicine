import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const site='G:/VisibleMedicine-temp/staging/20261101-hepatic-website/website';
const source='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas';
const output='G:/VisibleMedicine-temp/staging/20261101-hepatic-website/coverage-output';
const parent='d567863a5a8af08b3bbbfa22adf512a389cdc3a3';
const head='b688ddd0c1fb6392ba8e8d7890142d750c8100f1';
const scopes=['root','nested','independent','reference'];
const files=['docs/anatomy-coverage/index.json',...scopes.map(s=>`docs/anatomy-coverage/${s}.json`),'scripts/check-anatomy-coverage.mjs','lib/anatomy-coverage-view.ts'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p));
const digest=value=>hash(JSON.stringify(value));
const replaceOnce=(text,from,to)=>{
  assert.notEqual(from,to,`Expected a changed value: ${from}`);
  assert.equal(text.split(from).length,2,`Expected exactly one ${from}`);
  return text.replace(from,to);
};
const git=(...args)=>execFileSync('git',args,{cwd:source,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),head);
assert.equal(git('status','--porcelain','--untracked-files=all').toString().trim(),'','Native source must be clean');
assert.equal(git('rev-parse',`${head}^`).toString().trim(),parent,'Unexpected native ancestry');
assert(fs.statSync(site).isDirectory(),'Prepared website is missing');
assert(!fs.existsSync(output),'Coverage output must be fresh');
assert(fs.statSync(path.dirname(output)).isDirectory(),'Coverage staging parent is missing');

const before=json(`${site}/docs/anatomy-coverage/index.json`);
assert.equal(before.sourceRevision,parent,'Unexpected website coverage baseline');
for(const row of before.sourceArtifacts)assert.equal(hash(read(`${site}/${row.path}`)),row.sha256,`Old ${row.scope} artifact changed`);
const original=files.map(p=>({path:p,sha256:hash(read(`${site}/${p}`))}));
const manifest=json(`${site}/atlas-review/manifest.json`);
assert.equal(manifest.revision,head,'Import and seal the new Atlas source before coverage migration');
assert(Array.isArray(manifest.files),'Missing imported source manifest');

// The authoritative generator starts four isolated source-bound producers and
// refuses an output directory that already exists. Its receipts stay intact.
execFileSync(process.execPath,['--max-old-space-size=384','scripts/generate-anatomy-coverage.mjs',
  '--source-root',source,'--revision',head,'--output-root',output],
 {cwd:site,windowsHide:true,encoding:'utf8',maxBuffer:4e6,env:{...process.env,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'}});
const candidate=json(`${output}/candidate-manifest.json`);
assert.equal(candidate.sourceRevision,head);
assert.equal(candidate.canonicalSnapshotsInstalled,false);
const after=json(`${output}/index.json`);
assert.equal(hash(read(`${output}/index.json`)),candidate.indexSha256);
assert.equal(after.sourceRevision,head);
assert.deepEqual(after.sourceArtifacts.map(r=>r.scope),scopes);
for(const row of after.sourceArtifacts)assert.equal(hash(read(`${output}/${row.scope}.json`)),row.sha256,`New ${row.scope} artifact mismatch`);

const oldInputs=before.evidence.sourceInputs,newInputs=after.evidence.sourceInputs;
const oldPaths=Object.keys(oldInputs),newPaths=Object.keys(newInputs);
assert.deepEqual(newPaths.filter(p=>!Object.hasOwn(oldInputs,p)),['content/hepatic-vascular-xray.ts']);
assert.deepEqual(oldPaths.filter(p=>!Object.hasOwn(newInputs,p)),[]);
assert.deepEqual(oldPaths.filter(p=>oldInputs[p]!==newInputs[p]),
 ['content/hepatic-teaching.ts','content/nested-teaching.ts']);
for(const p of oldPaths)assert.equal(hash(git('show',`${parent}:${p}`)),oldInputs[p],`Old source ${p} mismatch`);
for(const p of newPaths)assert.equal(hash(read(`${source}/${p}`)),newInputs[p],`New source ${p} mismatch`);
assert.deepEqual(after.scopedCounts,before.scopedCounts,'Coverage counts changed');
assert.deepEqual(after.assessment,before.assessment,'Coverage assessment changed');
const semantic=ledger=>{
  const value=structuredClone(ledger);
  delete value.sourceRevision;
  delete value.evidence.sourceInputs;
  if(Array.isArray(value.sourceArtifacts))for(const artifact of value.sourceArtifacts)delete artifact.sha256;
  return value;
};
for(const scope of scopes)assert.deepEqual(semantic(json(`${output}/${scope}.json`)),
 semantic(json(`${site}/docs/anatomy-coverage/${scope}.json`)),`${scope} coverage meaning changed`);
assert.deepEqual(semantic(after),semantic(before),'Index coverage meaning changed');

const byPath=new Map();
for(const f of manifest.files){assert(typeof f.path==='string'&&!byPath.has(f.path),'Invalid imported source manifest');byPath.set(f.path,f);}
let imported=0,metadataOnly=0;
const importedIdentity=[];
for(const p of newPaths.sort()){
  const f=byPath.get(p);
  if(f){assert.equal(f.sourceSha256,newInputs[p],`Imported source ${p} mismatch`);assert(/^[a-f0-9]{64}$/.test(f.importedSha256),`Missing imported hash ${p}`);
    imported++;importedIdentity.push({path:p,sourceSha256:f.sourceSha256,importedSha256:f.importedSha256});}
  else{assert(p==='package.json'||/^(?:LICENSES\/bodyparts3d-v4-index\/|docs\/|scripts\/|content\/(?:reference-male-inventory|source-inventory)\.json$)/.test(p),`Unexpected missing import ${p}`);metadataOnly++;}
}
for(const p of ['content/hepatic-vascular-xray.ts','content/hepatic-teaching.ts','content/nested-teaching.ts'])assert(byPath.has(p),`Hepatic source not imported: ${p}`);
assert.equal(imported,147,'Unexpected imported coverage count');
assert.equal(metadataOnly,26,'Unexpected coverage metadata count');
assert.equal(newInputs['package.json'],oldInputs['package.json'],'Source package identity changed');

// Preserve the exact previous snapshots before replacing them in the new site.
for(const row of original){const target=`${output}/before/${row.path}`;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,read(`${site}/${row.path}`),{flag:'wx'});}
let checker=read(`${site}/scripts/check-anatomy-coverage.mjs`).toString();
checker=replaceOnce(checker,`coverageRevision='${parent}'`,`coverageRevision='${head}'`);
for(const scope of scopes){
 const old=before.sourceArtifacts.find(r=>r.scope===scope),fresh=after.sourceArtifacts.find(r=>r.scope===scope);
 assert(old&&fresh);
 checker=replaceOnce(checker,old.sha256,fresh.sha256);
 fs.copyFileSync(`${output}/${scope}.json`,`${site}/docs/anatomy-coverage/${scope}.json`);
}
fs.copyFileSync(`${output}/index.json`,`${site}/docs/anatomy-coverage/index.json`);
fs.writeFileSync(`${site}/scripts/check-anatomy-coverage.mjs`,checker);
let view=read(`${site}/lib/anatomy-coverage-view.ts`).toString();
view=replaceOnce(view,`COVERAGE_SOURCE_REVISION='${parent}'`,`COVERAGE_SOURCE_REVISION='${head}'`);
view=replaceOnce(view,`COVERAGE_SNAPSHOT_REVISION='${digest(before)}'`,`COVERAGE_SNAPSHOT_REVISION='${digest(after)}'`);
view=view.replace(/const coverageImportedRevision='[a-f0-9]{64}';/,
 `const coverageImportedRevision='${digest(importedIdentity)}';`);
assert(view.includes(`const coverageImportedRevision='${digest(importedIdentity)}';`));
view=replaceOnce(view,'if(imported!==146||metadataOnly!==26',`if(imported!==${imported}||metadataOnly!==${metadataOnly}`);
fs.writeFileSync(`${site}/lib/anatomy-coverage-view.ts`,view);

const check=execFileSync(process.execPath,['--max-old-space-size=384','scripts/check-anatomy-coverage.mjs','--source-root',source],
 {cwd:site,windowsHide:true,encoding:'utf8',maxBuffer:4e6});
fs.writeFileSync(`${output}/check.log`,check,{flag:'wx'});
const receipt={schema:'vm-hepatic-coverage-migration/1',sourceRevision:head,parentRevision:parent,
 sourceInputs:newPaths.length,changedSourceInputs:['content/hepatic-teaching.ts','content/nested-teaching.ts'],
 addedSourceInputs:['content/hepatic-vascular-xray.ts'],scopedCounts:after.scopedCounts,
 semanticCoverageUnchanged:true,clinicalApproval:false,anatomicalCompletenessProven:false,installed:false,
 changes:original.map(row=>({...row,afterSha256:hash(read(`${site}/${row.path}`))})),
 candidateManifestSha256:hash(read(`${output}/candidate-manifest.json`)),checkLogSha256:hash(read(`${output}/check.log`))};
fs.writeFileSync(`${output}/migration-receipt.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verdict:'pass',sourceRevision:head,sourceInputs:newPaths.length,changedPaths:receipt.changes.length,output,installed:false}));
