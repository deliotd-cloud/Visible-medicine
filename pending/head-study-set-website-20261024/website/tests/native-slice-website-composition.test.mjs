import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {historicalWebsiteRoot,readHistoricalSource} from './head-study-set-historical-source.mjs';

// This proves the exact native-slice Website epoch, which is historical to its successor.
const site=historicalWebsiteRoot;
const stage='F:/VisibleMedicine/staging/20261024-native-slice-website';
const parent='F:/VisibleMedicine/staging/20261024-regional-discovery-ui/website';
const parentReceipt='F:/VisibleMedicine/staging/20261024-regional-discovery-ui/SOURCE_BOUND.json';
const proposalReceipt='F:/VisibleMedicine/staging/20261024-native-slice-commit/PROPOSAL_BOUND.json';
const changed='components/HeadAtlasViewer.tsx';
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const revisions=['content/body-renderer-revision.json','content/review-revisions.json'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=(root,path)=>root===site?readHistoricalSource(path):readFileSync(resolve(root,path));
const json=(root,path)=>JSON.parse(bytes(root,path));
const clone=value=>structuredClone(value);
const sameBytes=(path)=>assert.deepEqual(bytes(site,path),bytes(parent,path),path);
const mapRows=rows=>new Map(rows.map(row=>[row.path,row]));
const uniquePaths=rows=>assert.equal(new Set(rows.map(row=>row.path)).size,rows.length,'Duplicate path');
const sealed=(path,hash)=>{const raw=readFileSync(path);assert.equal(sha(raw),hash,path);return JSON.parse(raw);};

function checkComposition(current,old,proposal){
 const {binding,manifest,body,shoulder,viewer}=current;
 const prior=old.binding;
 uniquePaths(binding.inputs);uniquePaths(prior.inputs);
 assert.equal(binding.inputs.length,prior.inputs.length);
 assert.deepEqual(binding.inputs.map(row=>row.path),prior.inputs.map(row=>row.path),'No added, removed or reordered Review input');
 const proposalViewer=mapRows(proposal.sourceRows).get(changed);
 assert(proposalViewer,'Exact proposal must contain viewer');
 const expected=prior.inputs.map(row=>row.path===changed?{...row,sha256:proposalViewer.sha256}:row);
 assert.deepEqual(binding.inputs,expected,'Only proposed viewer may change Review inputs');
 assert.notEqual(proposalViewer.sha256,mapRows(prior.inputs).get(changed).sha256);
 assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
 assert.notEqual(binding.sha256,prior.sha256,'New source requires new Review integration');
 assert.equal(binding.sourceCommit,prior.sourceCommit);

 assert.equal(manifest.revision,old.manifest.revision);
 assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
 uniquePaths(manifest.files);uniquePaths(old.manifest.files);
 assert.deepEqual(manifest.files.map(row=>row.path),old.manifest.files.map(row=>row.path));
 const priorFiles=mapRows(old.manifest.files);
 for(const row of manifest.files){
  const before=priorFiles.get(row.path);
  assert.equal(row.sourceSha256,before.sourceSha256,row.path+': native source remains fixed');
  if(revisions.includes(row.path))continue;
  assert.equal(row.importedSha256,row.path===changed?proposalViewer.sha256:before.importedSha256,row.path+': imported source');
 }
 assert.deepEqual(body.sourceRendererSha256,old.body.sourceRendererSha256);
 assert.deepEqual(body.dependencies,old.body.dependencies);
 assert.deepEqual(body.display,old.body.display);
 assert.equal(body.websiteIntegrationSha256,binding.sha256);
 assert.equal(body.sha256,sha(JSON.stringify({source:body.sourceRendererSha256,website:binding.sha256})));
 assert.notEqual(body.sha256,old.body.sha256);
 const expectedBody={...clone(old.body),websiteIntegrationSha256:binding.sha256,sha256:body.sha256};
 assert.deepEqual(body,expectedBody,'All non-presentation renderer metadata remains exact');
 assert.deepEqual(shoulder.sourceRevisions,old.shoulder.sourceRevisions);
 assert.equal(shoulder.websiteIntegrationSha256,binding.sha256);
 assert.deepEqual(Object.keys(shoulder.revisions),Object.keys(shoulder.sourceRevisions));
 assert.equal(Object.keys(shoulder.revisions).length,9);
 for(const [id,source] of Object.entries(shoulder.sourceRevisions)){
  const expected={...source};
  for(const track of ['geometry','teaching'])expected[track]=source[track]===null?null:sha(JSON.stringify({source:source[track],website:binding.sha256}));
  assert.deepEqual(shoulder.revisions[id],expected,id+': exact display revisions, no inherited approval');
  assert.notDeepEqual(shoulder.revisions[id],old.shoulder.revisions[id]);
 }
 const expectedShoulder={...clone(old.shoulder),websiteIntegrationSha256:binding.sha256,revisions:clone(shoulder.revisions)};
 assert.deepEqual(shoulder,expectedShoulder,'No other source, clearance or decision field changes');
 for(const path of revisions){
  const value=path===revisions[0]?body:shoulder;
  assert.equal(mapRows(manifest.files).get(path).importedSha256,sha(bytes(site,'atlas-review/'+path)));
  assert(value.websiteIntegrationSha256===binding.sha256);
 }
 const expectedManifest=clone(old.manifest);expectedManifest.websiteIntegrationSha256=binding.sha256;
 for(const row of expectedManifest.files)if(revisions.includes(row.path))row.importedSha256=mapRows(manifest.files).get(row.path).importedSha256;
 assert.deepEqual(manifest,expectedManifest,'No source/import manifest changes beyond exact presentation binding');
 assert.equal(viewer.sourceCommit,manifest.revision);
 assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
 assert.equal(viewer.mode,'production');
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.modelDelivery,old.viewer.modelDelivery);
 assert.deepEqual(viewer.packages,old.viewer.packages,'Exact package names, versions and licences');
 assert.equal(viewer.files.length,old.viewer.files.length);
 uniquePaths(viewer.files);
}

test('the sealed proposal is the sole changed current Review input, with fresh display revisions and protected viewer',()=>{
 const parentSeal=sealed(parentReceipt,'a58bdf58304bfc74e16639ea8708463c6cdde9d94b99d73214ced179b613f958');
 const proposal=sealed(proposalReceipt,'9bed26d92efacf0f4bc6862943cf6953bab1e30cd6474647e5fddd07ea10bd80');
 assert.equal(proposal.parentReceiptSha256,sha(readFileSync(parentReceipt)));
 const proposalViewer=mapRows(proposal.sourceRows).get(changed);
 assert.equal(sha(bytes(site,changed)),proposalViewer.sha256);
 assert.equal(sha(bytes(parent,changed)),mapRows(parentSeal.sourceRows).get(changed).sha256);
 const paths=['atlas-review/manifest.json','atlas-review/integration-inputs.json',
  'atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json',
  'public/atlas-review-viewer/manifest.json'];
 for(const path of paths)assert.equal(sha(bytes(parent,path)),mapRows(parentSeal.sourceRows).get(path).sha256,path+': sealed parent');
 const load=root=>({manifest:json(root,paths[0]),binding:json(root,paths[1]),body:json(root,paths[2]),shoulder:json(root,paths[3]),viewer:json(root,paths[4])});
 const current=load(site),old=load(parent);
 for(const row of current.binding.inputs)assert.equal(sha(bytes(site,row.path)),row.sha256,row.path+': actual Review input');
 for(const row of current.manifest.files)assert.equal(sha(bytes(site,'atlas-review/'+row.path)),row.importedSha256,row.path+': actual import');
 for(const row of current.viewer.files)assert.equal(sha(bytes(site,'public/atlas-review-viewer/'+row.path)),row.sha256,row.path+': actual production artifact');
 checkComposition(current,old,proposal);

 for(const path of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md',
  'lib/atlas-model-inventory.json','lib/atlas-delivery-policy.ts','public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'])sameBytes(path);
 for(const name of modules){
  for(const file of ['manifest.json','source-inputs.json'])sameBytes(`public/atlas-runtime/${name}/${file}`);
  const manifest=json(site,`public/atlas-runtime/${name}/manifest.json`);
  assert.equal(manifest.patientDataIncluded,false);
  assert.notEqual(manifest.clinicalApproved,true);
  for(const row of manifest.files)assert.equal(sha(bytes(site,`public/atlas-runtime/${name}/${row.path}`)),row.sha256,name+': '+row.path);
 }
 for(const path of ['atlas-review/content/body-review-display-pins.json','atlas-review/content/body-review-source-pins.json']){
  if(mapRows(parentSeal.sourceRows).has(path))sameBytes(path);
 }

 const oldPin=json(parent,'tests/fixtures/current-atlas-delivery.json');
 const savedPin=json(stage,'preimages/tests/fixtures/current-atlas-delivery.json.raw');
 assert.deepEqual(savedPin,oldPin,'Genuine fixture preimage remains pinned');
 assert.equal(sha(bytes(parent,'tests/fixtures/current-atlas-delivery.json')),mapRows(parentSeal.sourceRows).get('tests/fixtures/current-atlas-delivery.json').sha256);
 const pin=json(site,'tests/fixtures/current-atlas-delivery.json');
 assert.deepEqual(Object.keys(pin).sort(),Object.keys(oldPin).sort());
 for(const key of ['schema','source','sourceTree','runtimeSources','reviewSourceFiles','viewerFiles','viewerPackages'])
  assert.deepEqual(pin[key],oldPin[key],key+': delivery contract unchanged');
 assert.equal(pin.reviewIntegration,current.binding.sha256);
 assert.deepEqual(Object.keys(pin.documents).sort(),Object.keys(oldPin.documents).sort());
 for(const [path,hash] of Object.entries(pin.documents)){
  assert.equal(hash,sha(bytes(site,path)),path+': actual current document');
  if(!['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'].includes(path))
   assert.equal(hash,oldPin.documents[path],path+': unrelated document pin');
 }
 assert.notEqual(pin.reviewIntegration,oldPin.reviewIntegration);
 for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])
  assert.notEqual(pin.documents[path],oldPin.documents[path],path+': rebound document');

 // In-memory tampering must fail even if an attacker recomputes the transport hash.
 const mutated=clone(current);mutated.binding.inputs[0].sha256='0'.repeat(64);
 mutated.binding.sha256=sha(JSON.stringify(mutated.binding.inputs));
 assert.throws(()=>checkComposition(mutated,old,proposal));
 const extra=clone(current);extra.binding.inputs.push({path:'unexpected.ts',sha256:'0'.repeat(64)});
 extra.binding.sha256=sha(JSON.stringify(extra.binding.inputs));
 assert.throws(()=>checkComposition(extra,old,proposal));
 const stale=clone(current);stale.viewer.websiteIntegrationSha256=old.binding.sha256;
 assert.throws(()=>checkComposition(stale,old,proposal));
 const approval=clone(current);approval.shoulder.revisions=clone(old.shoulder.revisions);
 assert.throws(()=>checkComposition(approval,old,proposal));
 const leaked=clone(current);leaked.viewer.personalRecordsIncluded=true;
 assert.throws(()=>checkComposition(leaked,old,proposal));
});
