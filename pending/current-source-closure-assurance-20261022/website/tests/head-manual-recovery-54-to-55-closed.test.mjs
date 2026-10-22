import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateRevision55Delivery as validateCurrentAtlasDelivery,readRevision55} from './historical-current-atlas-delivery-55.mjs';
import {revision53,validateRevision53Delivery} from './historical-head-manual-recovery-delivery-53.mjs';
import {revision54,readRevision54,readRevision54Register,validateRevision54Delivery} from './historical-current-atlas-delivery-54.mjs';
import {validateCurrentAtlasDelivery as validateActualCurrentDelivery} from './current-atlas-delivery.mjs';

const read=path=>readRevision55(path);
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];

test('actual current delivery remains independently bound beyond the closed54/55 transitions',()=>{
 const current=validateActualCurrentDelivery();
 assert.equal(current.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(current.sourceTree,'db21ed3dee259c390878450b3495468996a3af85');
 assert.equal(current.reviewIntegration,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
 assert.equal(current.reviewSourceFiles,1562);
 assert.deepEqual(current.runtimeSources,{'head-neck':current.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});
 assert.throws(()=>validateActualCurrentDelivery({pin:revision54}));
 assert.throws(()=>validateActualCurrentDelivery({pin:validateRevision55Delivery()}));
});

test('closed53 and closed54 remain separately pinned and cannot admit the current delivery',()=>{
 assert.equal(validateRevision53Delivery().reviewIntegration,revision53.review);
 assert.deepEqual(validateRevision54Delivery(),revision54);
 assert.equal(revision53.source,revision54.source);
 assert.equal(revision53.sourceTree,revision54.sourceTree);
 assert.equal(revision54.reviewSourceFiles,1528);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:revision54}));
 const prior=JSON.parse(readRevision54('atlas-review/integration-inputs.json'));
 assert.equal(prior.inputs.length,1658);
 const preserved=read('tests/fixtures/head-manual-recovery-transition-53-to-54.txt');
 assert.equal(sha(preserved),'9f534e855322486783da10fd70ed33a6726ad87646a907364b0cc4a7e193fbb9');
});

test('current source and Review bind exactly six changed and three added website inputs',()=>{
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.source,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(current.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
 assert.equal(current.reviewIntegration,'4f0846e90efe86c86ddbfb5817cbd8b82baaf1b05c3d6eead91caa85a320013d');
 assert.equal(current.reviewSourceFiles,1531);
 const prior=JSON.parse(readRevision54('atlas-review/integration-inputs.json'));
 const inputs=json('atlas-review/integration-inputs.json');
 const old=new Map(prior.inputs.map(row=>[row.path,row.sha256]));
 assert.equal(prior.inputs.length,1658);
 assert.equal(inputs.inputs.length,1661);
 assert.deepEqual(inputs.inputs.filter(row=>!old.has(row.path)).map(row=>row.path),[
  'atlas-review/content/superficial-medial-plantar-ultrasound-pins.json',
  'atlas-review/content/superficial-medial-plantar-ultrasound.ts',
  'atlas-review/lib/superficial-medial-plantar-ultrasound.ts',
 ]);
 assert.deepEqual(inputs.inputs.filter(row=>old.has(row.path)&&old.get(row.path)!==row.sha256).map(row=>row.path),[
  'atlas-review/app/body-content.ts',
  'atlas-review/content/body-review-display-pins.json',
  'atlas-review/content/regional-teaching/foot.json',
  'docs/anatomy-coverage/index.json',
  'lib/anatomy-coverage-view.ts',
  'scripts/import-clinical-review.mjs',
 ]);
 for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
 assert.equal(sha(JSON.stringify(inputs.inputs)),current.reviewIntegration);
});

test('Review import changed only the mapped superficial plantar content and revision records',()=>{
 const prior=JSON.parse(readRevision54('atlas-review/manifest.json'));
 const current=json('atlas-review/manifest.json');
 const old=new Map(prior.files.map(row=>[row.path,row.importedSha256]));
 assert.equal(prior.files.length,1528);assert.equal(current.files.length,1531);
 assert.deepEqual(current.files.filter(row=>!old.has(row.path)).map(row=>row.path),[
  'lib/superficial-medial-plantar-ultrasound.ts',
  'content/superficial-medial-plantar-ultrasound-pins.json',
  'content/superficial-medial-plantar-ultrasound.ts',
 ]);
 assert.deepEqual(current.files.filter(row=>old.has(row.path)&&old.get(row.path)!==row.importedSha256).map(row=>row.path),[
  'app/body-content.ts',
  'content/body-renderer-revision.json',
  'content/review-revisions.json',
  'content/body-review-display-pins.json',
  'content/regional-teaching/foot.json',
 ]);
 for(const row of current.files)assert.equal(sha(read('atlas-review/'+row.path)),row.importedSha256,row.path);
 const oldPins=JSON.parse(readRevision54('atlas-review/content/body-review-display-pins.json'));
 const newPins=json('atlas-review/content/body-review-display-pins.json');
 assert.equal(oldPins.pins.length,1104);assert.equal(newPins.pins.length,1104);
 assert.deepEqual(newPins.pins.filter((pin,index)=>JSON.stringify(pin)!==JSON.stringify(oldPins.pins[index])).map(pin=>pin.structureId),[
  'vm:anatomy:body:foot:left:vessel:left-superficial-medial-plantar-artery',
  'vm:anatomy:body:foot:right:vessel:right-superficial-medial-plantar-artery',
 ]);
});

test('four learners retain non-file anatomy scope and model evidence across source refresh',()=>{
 for(const module of modules){
  const path=`public/atlas-runtime/${module}/manifest.json`;
  const old=JSON.parse(readRevision54(path));
  const now=json(path);
  assert.equal(old.sourceCommit,revision54.source);
  assert.equal(now.sourceCommit,validateCurrentAtlasDelivery().source);
  for(const key of Object.keys(old))if(!['sourceCommit','files'].includes(key))assert.deepEqual(now[key],old[key],module+':'+key);
  const oldModels=old.files.filter(row=>/\.(?:glb|gltf)$/.test(row.path));
  const nowModels=now.files.filter(row=>/\.(?:glb|gltf)$/.test(row.path));
  assert.deepEqual(nowModels,oldModels,module+' model bytes');
 }
 const inventory=json('lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
 assert.equal(inventory.models.reduce((sum,model)=>sum+model.bytes,0),199072480);
});

test('register55 retains all 71 requirements, eight optional ideas, statuses, owners and boundaries',()=>{
 const before=readRevision54Register(),now=json('docs/completion-checklist.json');
 assert.equal(now.revision,55);
 assert.equal(before.items.length,71);assert.equal(now.items.length,71);
 assert.equal(before.items.filter(item=>item.scope==='optional').length,8);
 assert.equal(now.items.filter(item=>item.scope==='optional').length,8);
 for(const old of before.items){
  const actual=now.items.find(item=>item.id===old.id);assert(actual,old.id);
  for(const [key,value] of Object.entries(old))if(key!=='evidence')assert.deepEqual(actual[key],value,old.id+':'+key);
  for(const evidence of old.evidence)assert(actual.evidence.includes(evidence),old.id+': evidence');
 }
 for(const [key,value] of Object.entries(before.baseline))if(!['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements'].includes(key))assert.deepEqual(now.baseline[key],value,key);
 assert.equal(now.baseline.atlasCommit,validateCurrentAtlasDelivery().source);
 assert.equal(now.baseline.atlasTree,validateCurrentAtlasDelivery().sourceTree);
 assert.equal(now.baseline.reviewIntegration,validateCurrentAtlasDelivery().reviewIntegration);
 assert.equal(now.baseline.reviewSourceFiles,1531);
 assert.equal(before.baseline.rootDraftPlacements,9326);
 assert.equal(before.baseline.rootPendingPlacements,571);
 assert.equal(now.baseline.rootDraftPlacements,9328);
 assert.equal(now.baseline.rootPendingPlacements,569);
 assert.equal(now.pendingAtlasSource.rootDraftPlacements,9328);
 assert.equal(now.pendingAtlasSource.rootPendingPlacements,569);
 assert.equal(now.baseline.privateClinicalDecisionCounts,null);
 assert.equal(now.baseline.publicReleaseApproval,null);
 for(const [key,value] of Object.entries(before.roots))assert.deepEqual(now.roots[key],value,key);
 for(const key of ['statusDefinitions','rules'])assert.deepEqual(now[key],before[key],key);
 assert.deepEqual(now.changeLog.slice(1),before.changeLog);
});
