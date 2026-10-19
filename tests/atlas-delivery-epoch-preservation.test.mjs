import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const path='tests/fixtures/delivery-before-20261016/manifest.json',bytes=readFileSync(path),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(bytes),'283924379ba85a620c75659ebe0030b7fe80bbaa89f91d9ea9c245c4c92b9a37');
const frozen=JSON.parse(bytes);

test('all17 exact pre-repair test and helper snapshots remain immutable',()=>{
 assert.equal(frozen.schema,'vm-delivery-tests-pre-repair-1');assert.equal(frozen.files.length,17);
 assert.match(frozen.scope,/not a claim/);assert.equal(new Set(frozen.files.map(f=>f.original)).size,17);
 for(const f of frozen.files){assert(/^tests\/fixtures\/delivery-before-20261016\/[a-z0-9.-]+\.txt$/.test(f.path));assert.equal(sha(readFileSync(f.path)),f.sha256,f.original);}
});

test('historical source epochs remain explicit while current helpers use the admitted delivery contract',()=>{
 const helpers=['atlas-forearm-delivery-fixture.ts','atlas-neck-liver-delivery-fixture.ts','atlas-hand-xray-mri-fixture.ts','atlas-spinal-study-specimen-fixture.ts'];
 assert.equal(frozen.atlasSource,'f1dc0ccc54ec82aa774720db3c822d3e0ea9c418','Immutable snapshot source, not current admission');
 currentAtlasDeliveryRoot();validateCurrentAtlasDelivery();
 for(const name of helpers){
  const old=frozen.files.find(f=>f.original==='tests/'+name);assert(old);const previous=readFileSync(old.path,'utf8'),now=readFileSync('tests/'+name,'utf8');
  assert(previous.includes('408759d57644b05402e98a937e7cf6338b5509cf'),'Original stale current source retained as evidence');
  for(const pin of ['f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6','88cea927d48729769b96ad8fe680b0872b7e6687','eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381'])assert(now.includes(pin),name+' historic identity');
  assert(now.includes("'./current-atlas-delivery.mjs'"));assert(now.includes('validateCurrentAtlasDelivery'));assert(now.includes('currentAtlasDeliveryRoot'));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert(now.includes(flag),name+' '+flag);
 }
});

test('the repair retains every direct test entry and adds no skip or todo directive',()=>{
 for(const f of frozen.files.filter(f=>f.original.endsWith('.test.ts'))){
  const before=readFileSync(f.path,'utf8'),after=readFileSync(f.original,'utf8');
  assert((after.match(/\btest\s*\(/g)||[]).length>=(before.match(/\btest\s*\(/g)||[]).length,f.original);
  assert(!/\btest\.(?:skip|todo|only)\s*\(/.test(after),f.original+' keeps its tests applicable');
 }
});
