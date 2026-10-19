import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateRevision54Delivery as validateCurrentAtlasDelivery,readRevision54} from './historical-current-atlas-delivery-54.mjs';
import {revision53,readRevision53,validateRevision53Delivery} from './historical-head-manual-recovery-delivery-53.mjs';

const read=path=>readRevision54(path);
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const replace=(text,before,after)=>{assert.equal(text.split(before).length,2,before);return text.replace(before,after);};
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];

test('closed53 remains historical while current admission binds exactly two changed website inputs',()=>{
  assert.equal(validateRevision53Delivery().reviewIntegration,revision53.review);
  const current=validateCurrentAtlasDelivery();
  assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision53Delivery()}));
  assert.equal(current.source,revision53.source);
  assert.equal(current.sourceTree,revision53.sourceTree);
  assert.equal(current.reviewIntegration,'af91db5ca835c33841628a71b52e6aa0f18ef258260e4866529731ed86a68373');
  assert.equal(current.reviewSourceFiles,1528);assert.equal(current.viewerFiles,46);assert.equal(current.viewerPackages,22);

  const prior=JSON.parse(readRevision53('atlas-review/integration-inputs.json'));
  const inputs=json('atlas-review/integration-inputs.json');
  const old=new Map(prior.inputs.map(row=>[row.path,row.sha256]));
  assert.equal(prior.inputs.length,1658);assert.equal(inputs.inputs.length,1658);
  assert.deepEqual(inputs.inputs.filter(row=>!old.has(row.path)).map(row=>row.path),[]);
  assert.deepEqual(inputs.inputs.filter(row=>old.has(row.path)&&old.get(row.path)!==row.sha256).map(row=>row.path),revision53.changedPriorInputs);
  for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
  assert.equal(sha(JSON.stringify(inputs.inputs)),current.reviewIntegration);
  assert.equal(sha(read('components/HeadAtlasComparisonNavigation.tsx')),'05d32d7e3fc96e56af9bab7c76ed622d2e6063cd8378ecc4d1f50d0a6f9432d4');
  assert.equal(sha(read('components/HeadAtlasLinkedModel.tsx')),'c90fd4b9a51a4fa67ef390fb6b79515825fd662160f83cabd127b7283b8d2fab');

  const admission=replace(readRevision53('tests/current-atlas-delivery.test.mjs').toString(),revision53.review,current.reviewIntegration);
  assert.deepEqual(read('tests/current-atlas-delivery.test.mjs'),Buffer.from(admission));
});

test('source, model inventory, four learner deliveries and unchanged Review rows retain closed53 identity',()=>{
  const oldPin=JSON.parse(readRevision53('tests/fixtures/current-atlas-delivery.json'));
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,oldPin.source);assert.equal(current.sourceTree,oldPin.sourceTree);
  for(const path of ['lib/atlas-model-inventory.json',...modules.flatMap(name=>[`public/atlas-runtime/${name}/manifest.json`,`public/atlas-runtime/${name}/source-inputs.json`])]){
    assert.equal(current.documents[path],oldPin.documents[path],path+' pin unchanged');
    assert.equal(sha(read(path)),oldPin.documents[path],path+' bytes unchanged');
  }
  const prior=JSON.parse(readRevision53('atlas-review/manifest.json'));
  const manifest=json('atlas-review/manifest.json');
  assert.equal(prior.files.length,1528);assert.equal(manifest.files.length,1528);
  for(const row of prior.files)if(!['content/body-renderer-revision.json','content/review-revisions.json'].includes(row.path)){
    assert.deepEqual(manifest.files.find(file=>file.path===row.path),row,row.path);
  }
});

test('register54 retains all 71 requirements, eight optional ideas, statuses, owners and acceptance boundaries',()=>{
  const before=JSON.parse(readRevision53('docs/completion-checklist.json'));
  const now=json('docs/completion-checklist.json');
  assert.equal(before.revision,53);assert.equal(now.revision,54);
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
  assert.equal(now.baseline.privateClinicalDecisionCounts,null);assert.equal(now.baseline.publicReleaseApproval,null);
  for(const [key,value] of Object.entries(before.roots))assert.deepEqual(now.roots[key],value,key);
  for(const key of ['statusDefinitions','rules','pendingAtlasSource'])assert.deepEqual(now[key],before[key],key);
  assert.deepEqual(now.changeLog.slice(1),before.changeLog);
});
