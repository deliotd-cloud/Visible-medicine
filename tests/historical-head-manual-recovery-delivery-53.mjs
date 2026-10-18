// Closed website53 evidence; manual recovery never admits this epoch as current.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const site=new URL('../',import.meta.url);
const bytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/epoch.json',import.meta.url));
assert.equal(sha(bytes),'963b7b46ee4215f91a47cf133a77a0d597613dea416b124c76f4d530dedfc11f');
export const revision53=JSON.parse(bytes);
assert.equal(revision53.schema,'vm-closed-delivery-json-text-epoch-1');
assert.equal(revision53.source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
assert.equal(revision53.review,'533ddf192b09b191aef129223f0d10d87c9c18ba669d963b43d09f76ff6a2fc4');
assert.deepEqual(revision53.changedPriorInputs,['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLinkedModel.tsx']);
assert.equal(revision53.files.length,26);
const records=new Map(revision53.files.map(row=>[row.path,row]));
assert.equal(records.size,26);

export function readRevision53(path){
  assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..'));
  const row=records.get(path);
  if(!row)return readFileSync(new URL(path,site));
  const frozen=Buffer.from(row.text,'utf8');
  assert.equal(frozen.length,row.bytes);assert.equal(sha(frozen),row.sha256,path+' frozen53');
  return frozen;
}

export function validateRevision53Delivery(options={}){
  assert(Object.keys(options).every(key=>key==='pin'),'Historical53 scope is fixed');
  return validateCurrentAtlasDelivery({pin:options.pin??JSON.parse(readRevision53('tests/fixtures/current-atlas-delivery.json')),read:readRevision53});
}
