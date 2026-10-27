// Materialize revision-bound stock integration recipes after PREPARATION.json exists.
// This file only writes NEW coordination scripts and a NEW coverage proposal.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261027-cardiac-imaging-website';
const proposal='F:/VisibleMedicine/staging/20261027-cardiac-imaging-coverage-proposal';
const prepFile=stage+'/PREPARATION.json';
const prep=json(prepFile),parent=json(prep.parent.path),native=json(prep.native.path);
assert.equal(hash(prep.parent.path),'13c5aeeca8085f70340a6891b0728f51abc993951949519492aae0e1b698a661');
assert.equal(hash(prep.native.path),'d253c0c46dc1b5dd8fd1d0323ac2ddccf4c17ebd5476e4eb43d896e19491eb6f');
assert.equal(prep.atlasHead,'d5c86abea551c92a4e59be57059e6b652fa01bde');
const oldStage='F:/VisibleMedicine/staging/20261027-find-keyboard-website';
const oldProposal='F:/VisibleMedicine/staging/20261027-find-keyboard-coverage-proposal';
const oldPrep=json(oldStage+'/PREPARATION.json');
const oldParent=json(oldPrep.parent.path),oldNative=json(oldPrep.native.path);
const parentManifest=json(parent.website+'/atlas-review/manifest.json');
const nativeRows=new Map(native.sourceRows.map(r=>[r.path,r]));
assert.equal(parentManifest.files.length,1627);
assert.deepEqual(parentManifest.files.filter(r=>nativeRows.get(r.path)?.sha256!==r.sourceSha256).map(r=>r.path).sort(),['content/body-renderer-revision.json','content/cardiac-teaching.ts']);
const oldIndex=json(parent.website+'/docs/anatomy-coverage/index.json');
const oldInputs=Object.entries(oldIndex.evidence.sourceInputs);
assert.equal(oldInputs.length,171);
const changes=oldInputs.filter(([p,h])=>nativeRows.get(p)?.sha256!==h).map(([p])=>p);
assert.deepEqual(changes,['content/cardiac-teaching.ts']);
const expectedNew=[]; // Importer dependency frontier is unchanged; checked again by the stock importer.
for(const r of parentManifest.files)assert(nativeRows.has(r.path),r.path);
assert(!fs.existsSync(proposal));fs.mkdirSync(proposal+'/witness',{recursive:true});
for(const [p,n] of [['docs/anatomy-coverage/index.json','index.json.raw'],['lib/anatomy-coverage-view.ts','anatomy-coverage-view.ts.raw'],['scripts/check-anatomy-coverage.mjs','check-anatomy-coverage.mjs.raw']])fs.copyFileSync(prep.website+'/'+p,proposal+'/witness/'+n,fs.constants.COPYFILE_EXCL);

const swaps=[
 [oldStage,stage],[oldProposal,proposal],[oldPrep.parent.path,prep.parent.path],[oldParent.website,parent.website],[oldPrep.native.path,prep.native.path],[oldNative.atlas,native.atlas],
 [oldPrep.parent.sha256,prep.parent.sha256],[oldPrep.native.sha256,prep.native.sha256],[hash(oldStage+'/PREPARATION.json'),hash(prepFile)],
 [oldNative.head,native.head],[oldNative.tree,native.tree],[oldParent.atlasHead,parent.atlasHead],[oldParent.atlasTree,parent.atlasTree],
 ['20261027-find-keyboard-native','20261027-cardiac-imaging-native'],['20261027-find-keyboard-runtime-exports','20261027-cardiac-imaging-runtime-exports'],
 [hash(oldProposal+'/witness/index.json.raw'),hash(proposal+'/witness/index.json.raw')],
 ['find-keyboard','cardiac-imaging'],
].sort((a,b)=>b[0].length-a[0].length);
function swap(s){for(let i=0;i<swaps.length;i++)s=s.replaceAll(swaps[i][0],`___CARDIAC_SWAP_${i}___`);for(let i=0;i<swaps.length;i++)s=s.replaceAll(`___CARDIAC_SWAP_${i}___`,swaps[i][1]);return s;}
function one(s,from,to){assert.equal(s.split(from).length,2,from);return s.replace(from,to);}

let helper=swap(fs.readFileSync(oldProposal+'/prepare-seams-v2.mjs','utf8'));
const code=new Map(parent.sourceRows.map(r=>[r.path,r.sha256]));
helper=helper.replace(/('(?:scripts\/[^']+|lib\/anatomy-coverage-view\.ts)': )'([a-f0-9]{64})'/g,(_m,p,h)=>{const key=p.match(/'([^']+)'/)[1];return `${p}'${code.get(key)??h}'`;});
helper=one(helper,"assert.equal(prep.schema, 'vm-cardiac-imaging-website-preparation/1');","assert.equal(prep.schema, 'vm-cardiac-imaging-website-preparation/1');");
helper=one(helper,"assert.deepEqual(changedInputs, [], 'All 171 coverage inputs must remain byte-exact');",`assert.deepEqual(changedInputs.map(r=>r.path), ${JSON.stringify(changes)}, 'Only the evidenced cardiac teaching input may change');`);
helper=one(helper,"assert.equal(sha256, oldIndex.evidence.sourceInputs[p],\n    `Unexpected coverage source change: ${p}`);", "assert.equal(sha256, changedInputs.find(r=>r.path===p)?.now ?? oldIndex.evidence.sourceInputs[p],\n    `Unexpected coverage source change: ${p}`);");
helper=one(helper,"assert.equal(importedDigest, 'a46cdb17e1398533b3b277dab2c8f90e0d941ea430cf1bcd988fc568fa420db0',\n  'Imported identity must remain exact under unchanged 171 source inputs');", `const oldImported = new Map(JSON.parse(read(parent.website + '/atlas-review/manifest.json')).files.map(r=>[r.path,r]));
const expectedIdentity = Object.keys(oldIndex.evidence.sourceInputs).sort().flatMap(p=>{
  const row=oldImported.get(p);if(!row)return [];
  assert.equal(row.sourceSha256,oldIndex.evidence.sourceInputs[p], 'Authenticated old imported input: '+p);
  if(p==='content/cardiac-teaching.ts'){
    assert.equal(row.importedSha256,row.sourceSha256,'Cardiac teaching must be byte-exact on import');
    const sha256=nativeRows.get(p);assert.match(sha256,/^[a-f0-9]{64}$/);
    return [{path:p,sourceSha256:sha256,importedSha256:sha256}];
  }
  return [{path:p,sourceSha256:row.sourceSha256,importedSha256:row.importedSha256}];
});
assert.equal(expectedIdentity.length,145,'Authenticated imported coverage population changed');
assert.deepEqual(importedIdentity,expectedIdentity,'Only cardiac teaching may change imported coverage identity');
assert.equal(importedDigest,hash(Buffer.from(JSON.stringify(expectedIdentity))),
  'Imported identity differs from the authenticated 145-row projection');`);
helper=one(helper,"assert(oldView.includes(`coverageImportedRevision='${importedDigest}'`),\n  'Imported identity changed; retain the existing Review refusal pin');", "assert(oldView.includes(`coverageImportedRevision='a46cdb17e1398533b3b277dab2c8f90e0d941ea430cf1bcd988fc568fa420db0'`),\n  'Authenticated old Review refusal pin differs');");
helper=one(helper,"  ['COVERAGE_SNAPSHOT_REVISION', snapshotDigest],", "  ['COVERAGE_SNAPSHOT_REVISION', snapshotDigest],\n  ['coverageImportedRevision', importedDigest],");
helper=one(helper,"for (const name of ['COVERAGE_SOURCE_REVISION', 'COVERAGE_SNAPSHOT_REVISION']) {", "for (const name of ['COVERAGE_SOURCE_REVISION', 'COVERAGE_SNAPSHOT_REVISION', 'coverageImportedRevision']) {");
fs.writeFileSync(proposal+'/prepare-seams-v2.mjs',helper,{flag:'wx'});
execFileSync(process.execPath,['--check',proposal+'/prepare-seams-v2.mjs'],{windowsHide:true});

const names=['import','generate','seams','install','review','pin','integration','seal'];
const templates=['import-find-keyboard-website-stock','generate-find-keyboard-website-coverage','run-find-keyboard-coverage-seams-v2','install-find-keyboard-website-coverage-v2','build-find-keyboard-website-review','refresh-find-keyboard-website-delivery-pin','run-find-keyboard-website-integration','seal-find-keyboard-website-source'];
const targets=['import-cardiac-imaging-website-stock','generate-cardiac-imaging-website-coverage','run-cardiac-imaging-coverage-seams-v2','install-cardiac-imaging-website-coverage-v2','build-cardiac-imaging-website-review','refresh-cardiac-imaging-website-delivery-pin','run-cardiac-imaging-website-integration','seal-cardiac-imaging-website-source'];
const records=[];
for(let i=0;i<templates.length;i++){
 const from=templates[i]+'-20261027.mjs',to=targets[i]+'-20261027.mjs';let s=swap(fs.readFileSync(from,'utf8'));
 s=s.replaceAll("['app/practice-keyboard-picker.tsx']",'[]').replaceAll("'atlas-review/app/practice-keyboard-picker.tsx'",'');
 s=s.replaceAll('oldManifest.files.length+1','oldManifest.files.length').replaceAll('oldInputs.inputs.length+1','oldInputs.inputs.length').replaceAll('old.files.length+1','old.files.length');
 s=s.replaceAll("json(parent.website+'/atlas-review/manifest.json').files.length+1","json(parent.website+'/atlas-review/manifest.json').files.length");
 s=s.replaceAll("[...oldInputs.inputs.map(r=>r.path),].sort()","oldInputs.inputs.map(r=>r.path).sort()");
 s=s.replaceAll("[...oldInputs.inputs.map(r=>r.path),''].sort()","oldInputs.inputs.map(r=>r.path).sort()");
 s=s.replaceAll("[...oldInputs.inputs.map(r=>r.path),].sort()","oldInputs.inputs.map(r=>r.path).sort()");
 if(names[i]==='seams'){
  s=one(s,`assert.equal(hash(helper),'c64a8fcde631b0c885e92ac0f888c865d395a5e69bfb5bd32d387bd2a9aedd9f');`,`assert.equal(hash(helper),'${hash(proposal+'/prepare-seams-v2.mjs')}');`);
  s=one(s,'assert.deepEqual(r.changedInputs,[]);',`assert.deepEqual(r.changedInputs.map(x=>x.path),${JSON.stringify(changes)});`);
 }
 if(names[i]==='integration')s=s.replaceAll('run-cardiac-imaging-coverage-seams-20261027.mjs','run-cardiac-imaging-coverage-seams-v2-20261027.mjs').replaceAll('install-cardiac-imaging-website-coverage-20261027.mjs','install-cardiac-imaging-website-coverage-v2-20261027.mjs');
 if(names[i]==='import')s=one(s,"assert.deepEqual(added,[]);","assert.deepEqual(added,[]);");
 if(names[i]==='seal')s=s.replaceAll('manifest.files.length,oldManifest.files.length+1','manifest.files.length,oldManifest.files.length');
 fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});records.push({path:to,sha256:hash(to)});
}
fs.writeFileSync(stage+'/STOCK_RECIPES.json',JSON.stringify({at:new Date().toISOString(),preparation:{path:prepFile,sha256:hash(prepFile)},nativeChanges:native.changedPaths,changedImportedPaths:['content/body-renderer-revision.json','content/cardiac-teaching.ts'],expectedAddedImportedPaths:expectedNew,coverageChangedInputs:changes,coverageInputCount:171,reviewSourceCount:1627,helper:{path:proposal+'/prepare-seams-v2.mjs',sha256:hash(proposal+'/prepare-seams-v2.mjs')},records},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({recipes:records.length,coverageChangedInputs:changes,addedImportedPaths:expectedNew}));
