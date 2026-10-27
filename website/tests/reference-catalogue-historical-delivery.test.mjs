import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {historicalReferenceDelivery} from './reference-catalogue-historical-delivery.mjs';
import {historicalReviewAe84Pin,historicalReviewAe84Read} from './historical-review-ae84.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {referenceCatalogueDeliveryRoles} from './reference-catalogue-delivery-role.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url)),fixture=name=>read('tests/fixtures/reference-catalogue-epoch/'+name),sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('complete old role helper is preserved with only the historical closure redirected',()=>{
 const original=fixture('role-before.mjs.raw');assert.equal(sha(original),'28eb2698ed60fed3cfdba857c71a0a0451a5b0fc13f0d0feb6a5b1df1201628a');
 let source=read('tests/reference-catalogue-delivery-role.mjs').toString();
 for(const [after,before]of [
  ["import {historicalReferenceDelivery} from './reference-catalogue-historical-delivery.mjs';","import {historicalReviewAe84Pin,historicalReviewAe84Read} from './historical-review-ae84.mjs';"],
  [' const readOld=historicalReferenceDelivery(readLive);',' const historical=historicalReviewAe84Pin(readLive),readOld=path=>historicalReviewAe84Read(path,readLive);\n validateCurrentAtlasDelivery({pin:historical,read:readOld});'],
 ]){assert.equal(source.split(after).length,2);source=source.replace(after,before);}
 assert.equal(source,original.toString(),'All live checks and original whole-test inverse assertions retained');
});

test('all twelve historical documents close exactly and remain separate from current delivery',()=>{
 const historical=historicalReferenceDelivery(read),pin=historicalReviewAe84Pin(read),live=validateCurrentAtlasDelivery();
 assert.equal(Object.keys(pin.documents).length,12);assert.equal(pin.viewerFiles,46);assert.equal(pin.viewerPackages,22);assert.equal(live.viewerFiles,54);assert.equal(live.viewerPackages,24);
 for(const [path,digest]of Object.entries(pin.documents))assert.equal(sha(historical(path)),digest,path);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:historical}));assert.throws(()=>validateCurrentAtlasDelivery({read:historical}));
 assert.throws(()=>historical('.env'));assert.throws(()=>historical('../private'));
 const path='atlas-review/manifest.json',bytes=historical(path);bytes.fill(0);assert.equal(sha(historical(path)),pin.documents[path]);
});

test('every archived runtime document refuses missing or altered bytes without live substitution',()=>{
 for(const module of ['shoulder','lower-limb','female-pelvis'])for(const file of ['manifest.json','source-inputs.json']){
  const name=module+'-'+file+'.raw',path='public/atlas-runtime/'+module+'/'+file;
  for(const changed of [Buffer.from('tampered'),read(path)])assert.throws(()=>historicalReferenceDelivery(read,{readFixture:n=>n===name?changed:fixture(n)}),/Exact ae84 document/);
  assert.throws(()=>historicalReferenceDelivery(read,{readFixture:n=>{if(n===name)throw Error('Missing fixture');return fixture(n);}}),/Missing fixture/);
 }
 assert.throws(()=>historicalReferenceDelivery(read,{readFixture:n=>n==='validator.mjs.raw'?Buffer.from('changed'):fixture(n)}),/Authentic ae84 validator/);
});

test('all other historical documents refuse altered or live bytes',()=>{
 const pin=historicalReviewAe84Pin(read);
 for(const path of Object.keys(pin.documents).filter(p=>!p.startsWith('public/atlas-runtime/')||p.includes('/head-neck/'))){
  assert.throws(()=>historicalReferenceDelivery(read,{readAe84:(p,fallback)=>p===path?Buffer.from('changed'):historicalReviewAe84Read(p,fallback)}),/Exact ae84 document/);
 }
});

test('reference role checks still reject stale live headers and every changed current metadata document',()=>{
 const headers={review:JSON.parse(read('atlas-review/manifest.json')),learner:JSON.parse(read('public/atlas-runtime/head-neck/manifest.json')),limb:JSON.parse(read('public/atlas-runtime/lower-limb/manifest.json'))};
 const old=referenceCatalogueDeliveryRoles(headers);assert.equal(old.review.revision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 for(const [key,field]of [['review','revision'],['learner','sourceCommit'],['limb','sourceCommit']]){const bad=structuredClone(headers);bad[key][field]='0'.repeat(40);assert.throws(()=>referenceCatalogueDeliveryRoles(bad));}
 for(const path of Object.keys(validateCurrentAtlasDelivery().documents))assert.throws(()=>referenceCatalogueDeliveryRoles(headers,p=>p===path?Buffer.from('changed'):read(p)),/Current delivery changed/);
});
