import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readRevision56,revision56,validateCurrentAtlasDelivery as validateClosed56} from './historical-current-atlas-delivery-56.mjs';

const root=resolve(process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url)));
const read=path=>readFileSync(join(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const delivery=await import(pathToFileURL(join(root,'tests/current-atlas-delivery.mjs')).href);
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const changed=(before,after,key)=>{
 const old=new Map(before.map(row=>[row.path,row[key]]));
 assert.deepEqual(after.filter(row=>!old.has(row.path)),[]);
 return after.filter(row=>old.get(row.path)!==row[key]).map(row=>row.path);
};

test('closed56 stays exact; live57 admits only the authenticated inserted CSS block',()=>{
 assert.deepEqual(validateClosed56(),revision56);
 const current=delivery.validateCurrentAtlasDelivery();
 assert.equal(current.source,revision56.source);
 assert.equal(current.sourceTree,revision56.sourceTree);
 assert.equal(current.reviewIntegration,'024b9d3104ee4a93bc50b6430851ea9184c3a2f95da8c133d6e302006993a902');
 assert.equal(current.reviewSourceFiles,1531);
 assert.equal(current.viewerFiles,46);
 assert.equal(current.viewerPackages,22);
 assert(delivery.currentAtlasDeliveryRoot());
 const old=JSON.parse(readRevision56('atlas-review/integration-inputs.json'));
 const now=json('atlas-review/integration-inputs.json');
 assert.equal(old.inputs.length,1661);assert.equal(now.inputs.length,1661);
 assert.deepEqual(changed(old.inputs,now.inputs,'sha256'),['components/head-atlas.css']);
 assert.equal(sha(JSON.stringify(now.inputs)),current.reviewIntegration);
 const cssBefore=readRevision56('components/head-atlas.css'),cssAfter=read('components/head-atlas.css');
 assert.equal(sha(cssBefore),'214fbad37e04a7ecd371c073ffb13c36cbcb5eccb208201a314bc6f0d0fdfb15');
 assert.equal(sha(cssAfter),'3edd00db77c3259e85f08243fec6a2be8ac9eb40655782fd8464a6e1aa404a3a');
 // The new block is inserted between two byte-exact pieces of the original sheet.
 const offset=6577,inserted=cssAfter.subarray(offset,offset+1085);
 assert.equal(inserted.length,1085);
 assert(Buffer.concat([cssAfter.subarray(0,offset),cssAfter.subarray(offset+inserted.length)]).equals(cssBefore),'Original CSS bytes must remain exact');
 assert.match(inserted.toString('utf8'),/@media\s*\(min-width:\s*1200px\)/);
 assert.equal(now.inputs.find(row=>row.path==='components/head-atlas.css').sha256,sha(cssAfter));
 for(const row of now.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
});

test('imported source changes only two generated revisions; learners, model, viewer counts and notices remain bound',()=>{
 const old=JSON.parse(readRevision56('atlas-review/manifest.json'));
 const now=json('atlas-review/manifest.json');
 assert.equal(old.files.length,1531);assert.equal(now.files.length,1531);
 assert.deepEqual(changed(old.files,now.files,'importedSha256'),['content/body-renderer-revision.json','content/review-revisions.json']);
 for(const row of now.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const current=delivery.validateCurrentAtlasDelivery();
 for(const path of ['lib/atlas-model-inventory.json',...modules.flatMap(name=>[`public/atlas-runtime/${name}/manifest.json`,`public/atlas-runtime/${name}/source-inputs.json`])]){
  assert.equal(current.documents[path],revision56.documents[path],path);
  assert.equal(sha(read(path)),revision56.documents[path],path);
 }
 const oldViewer=JSON.parse(readRevision56('public/atlas-review-viewer/manifest.json'));
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
 assert.deepEqual(viewer.packages,oldViewer.packages);
 assert.equal(viewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt').sha256,oldViewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt').sha256);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256,row.path);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,current.reviewIntegration);
 for(const name of modules){
  const base=`public/atlas-runtime/${name}/`;
  const before=JSON.parse(readRevision56(base+'manifest.json'));
  assert(before.files.some(row=>row.path==='LICENSES/THIRD_PARTY_NOTICES.md'));
  assert.equal(sha(read(base+'LICENSES/THIRD_PARTY_NOTICES.md')),before.files.find(row=>row.path==='LICENSES/THIRD_PARTY_NOTICES.md').sha256);
 }
});

test('Register57 preserves all71 requirements, eight optional ideas, statuses, owners and acceptance',()=>{
 const before=JSON.parse(readRevision56('docs/completion-checklist.json'));
 const now=json('docs/completion-checklist.json');
 assert.equal(before.revision,56);assert.equal(now.revision,57);
 assert.equal(before.items.length,71);assert.equal(now.items.length,71);
 assert.equal(before.items.filter(item=>item.scope==='optional').length,8);
 assert.equal(now.items.filter(item=>item.scope==='optional').length,8);
 for(const old of before.items){
  const actual=now.items.find(item=>item.id===old.id);assert(actual,old.id);
  for(const [key,value] of Object.entries(old))if(key!=='evidence')assert.deepEqual(actual[key],value,old.id+':'+key);
  for(const evidence of old.evidence)assert(actual.evidence.includes(evidence),old.id+': evidence');
 }
 for(const [key,value] of Object.entries(before.baseline))if(key!=='reviewIntegration')assert.deepEqual(now.baseline[key],value,key);
 assert.equal(now.baseline.reviewIntegration,delivery.validateCurrentAtlasDelivery().reviewIntegration);
 for(const [key,value] of Object.entries(before.roots))assert.deepEqual(now.roots[key],value,key);
 for(const key of ['statusDefinitions','rules'])assert.deepEqual(now[key],before[key],key);
 assert.equal(now.changeLog[0].revision,57);
 assert.deepEqual(now.changeLog.slice(1),before.changeLog);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);
 assert.equal(now.baseline.publicReleaseApproval,null);
});
