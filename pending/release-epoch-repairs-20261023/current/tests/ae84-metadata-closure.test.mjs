import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const records=[
 ['lib/atlas-model-inventory.json','model-inventory.json.raw','a9eb65f2f5645bcc88326dc41f3e5c0a8a37530aa0bc04deefd6bbd6078e8757'],
 ['public/atlas-runtime/head-neck/manifest.json','head-neck-manifest.json.raw','19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b'],
 ['public/atlas-runtime/head-neck/source-inputs.json','head-neck-source-inputs.json.raw','b76525d1b8da433e95b8c9c58af675ef2f4d337c8e6fb35e91cf1e5955ba7dba'],
];
const fixture=name=>read('tests/fixtures/ae84-review/'+name);
const historical=p=>historicalReviewAe84Read(p,read);

test('only three exact metadata overlays extend the complete historical reader',()=>{
 let inverse=read('tests/historical-review-ae84.mjs').toString();
 for(const [p,name,digest]of records){
  const line=` ['${p}',['${name}','${digest}']],\n`;
  assert.equal(inverse.split(line).length,2);inverse=inverse.replace(line,'');
  assert.equal(sha(fixture(name)),digest,'Authentic old bytes, not generated replacements');
 }
 assert.equal(sha(inverse),'d6e4bbb9e02ec60d64e685c8565f4d9baa73f9cdf2fa75d6857e83a5ddcd3a37',
  'Every old refusal, fallback and reader byte remains exact');
});

test('full old delivery metadata closes at ae84 while all 137 model identities remain exact',()=>{
 const pin=historicalReviewAe84Pin(read),seen=[];
 const packet=validateCurrentAtlasDelivery({pin,read:p=>{seen.push(p);return historical(p);}});
 assert.equal(packet.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.deepEqual(seen.sort(),Object.keys(pin.documents).sort());assert.equal(seen.length,12);
 for(const p of seen)assert.equal(sha(historical(p)),pin.documents[p],p);
 const old=JSON.parse(historical('lib/atlas-model-inventory.json')),current=JSON.parse(read('lib/atlas-model-inventory.json'));
 assert.equal(old.models.length,137);assert.deepEqual(old.models,current.models);
 assert.equal(old.models.flatMap(row=>row.paths).length,144);
});

test('new frozen paths refuse missing, tampered or later-epoch bytes without live fallback',()=>{
 for(const [p,name]of records){
  let liveReads=0;const live=()=>{liveReads++;throw Error('Frozen path must not fall back');};
  assert.deepEqual(historicalReviewAe84Read(p,live),fixture(name));assert.equal(liveReads,0);
  assert.throws(()=>historicalReviewAe84Read(p,live,()=>{throw Error('Missing historical metadata');}),/Missing historical metadata/);
  assert.throws(()=>historicalReviewAe84Read(p,live,()=>Buffer.from('tampered')),/Authentic ae84 overlay/);
  assert.throws(()=>historicalReviewAe84Read(p,live,()=>read(p)),/Authentic ae84 overlay/);
  assert.equal(liveReads,0);
 }
 const sentinel=Buffer.from('untouched live path');assert.equal(historicalReviewAe84Read('unrelated/source.ts',()=>sentinel),sentinel);
});

test('default current delivery stays separate and rejects the historical pin',()=>{
 const current=validateCurrentAtlasDelivery(),old=historicalReviewAe84Pin(read);
 assert.equal(current.source,CURRENT_ATLAS_REVISION);
 assert.notEqual(current.source,old.source);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),/Current delivery changed/);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:current,read:historical}),/Current delivery changed/);
 for(const [p,digest]of Object.entries(current.documents))assert.equal(sha(read(p)),digest,p);
});
