// Static closed-epoch proof. This file intentionally does not import current admission.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const replace=(source,before,after)=>{assert.equal(source.split(before).length,2,before);return source.replace(before,after);};
const epochBytes=read('tests/fixtures/head-manual-recovery-53/epoch.json');
const epoch=JSON.parse(epochBytes);
const records=new Map(epoch.files.map(row=>[row.path,row]));
const frozen=path=>{const row=records.get(path);assert(row,path);const bytes=Buffer.from(row.text,'utf8');assert.equal(bytes.length,row.bytes,path);assert.equal(sha(bytes),row.sha256,path);return bytes;};

test('closed53 fixture retains all 26 exact UTF-8 bytes, hashes and bounded paths',()=>{
  assert.equal(sha(epochBytes),'963b7b46ee4215f91a47cf133a77a0d597613dea416b124c76f4d530dedfc11f');
  assert.equal(epoch.schema,'vm-closed-delivery-json-text-epoch-1');
  assert.equal(epoch.source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
  assert.equal(epoch.review,'533ddf192b09b191aef129223f0d10d87c9c18ba669d963b43d09f76ff6a2fc4');
  assert.deepEqual(epoch.changedPriorInputs,['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx']);
  assert.equal(epoch.files.length,26);assert.equal(records.size,26);
  for(const row of epoch.files){
    assert.match(row.path,/^[A-Za-z0-9_./-]+$/);assert(!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
    assert.deepEqual(Object.keys(row).sort(),['bytes','path','sha256','text']);
    assert.match(row.sha256,/^[a-f0-9]{64}$/);frozen(row.path);
  }
});

test('four historical source files reconstruct byte-identical originals from exact read seams',()=>{
  let native=frozen('tests/head-native-history-current-transition.test.mjs').toString();
  native=replace(native,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';import {revision52","import {readRevision53,validateRevision53Delivery} from './historical-head-manual-recovery-delivery-53.mjs';const validateCurrentAtlasDelivery=validateRevision53Delivery;import {revision52");
  native=replace(native,"const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=","const read=p=>readRevision53(p),sha=");
  assert.deepEqual(read('tests/head-native-history-current-transition.test.mjs'),Buffer.from(native));

  let helper52=frozen('tests/historical-native-head-history-delivery-52.mjs').toString();
  helper52=replace(helper52,"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';","import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {readRevision53,revision53} from './historical-head-manual-recovery-delivery-53.mjs';");
  helper52=replace(helper52,'const row=records.get(path);if(!row)',"const row=records.get(path);if(!row&&revision53.changedPriorInputs.includes(path))return readRevision53(path);if(!row)");
  helper52=replace(helper52,"if(!row)return readFileSync(new URL(path,site));","if(!row&&path==='tests/atlas-cerebral-lobar-imaging.test.ts'){const b=readFileSync(new URL('./fixtures/closed-cerebral-current-52/test.ts.txt',import.meta.url));assert.equal(sha(b),'c474c475f57b487da4492852c14f8cf7462895ec5fabc71e4c528ec2bb1e5562');return b;}if(!row)return readFileSync(new URL(path,site));");
  assert.deepEqual(read('tests/historical-native-head-history-delivery-52.mjs'),Buffer.from(helper52));

  const oldList="'components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs'";
  const newList=oldList+",'components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx'";
  for(const path of ['tests/historical-radial-eus-delivery-51.mjs','tests/historical-lacrimal-delivery-50.mjs']){
    assert.deepEqual(read(path),Buffer.from(replace(frozen(path).toString(),oldList,newList)),path);
  }
});

test('the two older fallback component hashes genuinely equal closed53, without reading current admission',()=>{
  const old51=JSON.parse(read('tests/fixtures/radial-eus-51/epoch.json'));
  const row=old51.files.find(file=>file.path==='atlas-review/integration-inputs.json');assert(row);
  const inputsBytes=read('tests/fixtures/radial-eus-51/'+row.storagePath);assert.equal(sha(inputsBytes),row.sha256);
  const inputs=JSON.parse(inputsBytes);
  for(const path of epoch.changedPriorInputs)assert.equal(inputs.inputs.find(input=>input.path===path)?.sha256,sha(frozen(path)),path);
});
