import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,readRevision56} from './historical-current-atlas-delivery-56.mjs';
import {revision55,readRevision55,readRevision55Register,validateRevision55Delivery} from './historical-current-atlas-delivery-55.mjs';

const read=path=>readRevision56(path);
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];

test('closed55 remains exact and cannot admit current56',()=>{
 assert.deepEqual(validateRevision55Delivery(),revision55);
 assert.equal(revision55.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(revision55.reviewIntegration,'4f0846e90efe86c86ddbfb5817cbd8b82baaf1b05c3d6eead91caa85a320013d');
 assert.equal(revision55.reviewSourceFiles,1531);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:revision55}));
 assert.equal(sha(readRevision55('tests/head-manual-recovery-current-transition.test.mjs')),'686f68964936c62483e483b013c6ed0bdf105a29908e821989174e8395a841fe');
 assert.equal(sha(readRevision55('tests/current-atlas-delivery.test.mjs')),'8eee814461c64c903514be3717a8ba88858b1fe63c1448d037d5d1ce879a511f');
});

test('current56 binds exactly two owned Review route CSS imports and no other website input',()=>{
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.source,revision55.source);
 assert.equal(current.sourceTree,revision55.sourceTree);
 assert.equal(current.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');
 assert.equal(current.reviewSourceFiles,1531);
 const old=JSON.parse(readRevision55('atlas-review/integration-inputs.json'));
 const now=json('atlas-review/integration-inputs.json');
 const prior=new Map(old.inputs.map(row=>[row.path,row.sha256]));
 assert.equal(old.inputs.length,1661);assert.equal(now.inputs.length,1661);
 assert.deepEqual(now.inputs.filter(row=>!prior.has(row.path)).map(row=>row.path),[]);
 assert.deepEqual(now.inputs.filter(row=>prior.get(row.path)!==row.sha256).map(row=>row.path),[
  'app/workspace/atlas-review/model/embedded/page.tsx',
  'app/workspace/atlas-review/model/page.tsx',
 ]);
 for(const row of now.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 assert.equal(sha(JSON.stringify(now.inputs)),current.reviewIntegration);
 for(const [path,statement] of [
  ['app/workspace/atlas-review/model/page.tsx',"import './review-model-embedded.css';\n"],
  ['app/workspace/atlas-review/model/embedded/page.tsx',"import '../review-model-embedded.css';\n"],
 ])assert.equal(read(path).toString('utf8'),statement+readRevision55(path).toString('utf8'),path+' exact import');
 for(const path of ['app/workspace/atlas-review/website-review.css','app/workspace/atlas-review/model/review-model-embedded.css']){
  assert.equal(sha(read(path)),prior.get(path),path+' unchanged stylesheet');
 }
});

test('Review imported source is unchanged except the two generated revision records',()=>{
 const old=JSON.parse(readRevision55('atlas-review/manifest.json'));
 const now=json('atlas-review/manifest.json');
 const prior=new Map(old.files.map(row=>[row.path,row.importedSha256]));
 assert.equal(old.files.length,1531);assert.equal(now.files.length,1531);
 assert.deepEqual(now.files.filter(row=>!prior.has(row.path)).map(row=>row.path),[]);
 assert.deepEqual(now.files.filter(row=>prior.get(row.path)!==row.importedSha256).map(row=>row.path),[
  'content/body-renderer-revision.json',
  'content/review-revisions.json',
 ]);
 for(const row of now.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const oldViewer=JSON.parse(readRevision55('public/atlas-review-viewer/manifest.json'));
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.deepEqual(viewer.packages,oldViewer.packages);
 assert.equal(viewer.websiteIntegrationSha256,validateCurrentAtlasDelivery().reviewIntegration);
 assert.equal(viewer.personalRecordsIncluded,false);
});

test('all four learner deliveries and model inventory retain exact closed55 bytes',()=>{
 const current=validateCurrentAtlasDelivery();
 for(const path of ['lib/atlas-model-inventory.json',...modules.flatMap(name=>[`public/atlas-runtime/${name}/manifest.json`,`public/atlas-runtime/${name}/source-inputs.json`])]){
  assert.equal(current.documents[path],revision55.documents[path],path+' pin');
  assert.equal(sha(read(path)),revision55.documents[path],path+' bytes');
 }
 const inventory=json('lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
 assert.equal(inventory.models.reduce((sum,model)=>sum+model.bytes,0),199072480);
});

test('register56 retains the 71 requirements, eight optional ideas and approval holds',()=>{
 const before=readRevision55Register(),now=json('docs/completion-checklist.json');
 assert.equal(now.revision,56);
 assert.equal(before.items.length,71);assert.equal(now.items.length,71);
 assert.equal(before.items.filter(item=>item.scope==='optional').length,8);
 assert.equal(now.items.filter(item=>item.scope==='optional').length,8);
 for(const old of before.items){
  const actual=now.items.find(item=>item.id===old.id);assert(actual,old.id);
  for(const [key,value] of Object.entries(old))if(key!=='evidence')assert.deepEqual(actual[key],value,old.id+':'+key);
  for(const evidence of old.evidence)assert(actual.evidence.includes(evidence),old.id+': evidence');
 }
 for(const [key,value] of Object.entries(before.baseline))if(key!=='reviewIntegration')assert.deepEqual(now.baseline[key],value,key);
 assert.equal(now.baseline.reviewIntegration,validateCurrentAtlasDelivery().reviewIntegration);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);
 assert.equal(now.baseline.publicReleaseApproval,null);
 for(const [key,value] of Object.entries(before.roots))assert.deepEqual(now.roots[key],value,key);
 for(const key of ['statusDefinitions','rules'])assert.deepEqual(now[key],before[key],key);
 assert.deepEqual(now.changeLog.slice(1),before.changeLog);
});
