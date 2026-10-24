import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const records=[
 ['lib/atlas-model-inventory.json','model-inventory.json.raw','a9eb65f2f5645bcc88326dc41f3e5c0a8a37530aa0bc04deefd6bbd6078e8757'],
 ['public/atlas-runtime/head-neck/manifest.json','head-neck-manifest.json.raw','19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b'],
 ['public/atlas-runtime/head-neck/source-inputs.json','head-neck-source-inputs.json.raw','b76525d1b8da433e95b8c9c58af675ef2f4d337c8e6fb35e91cf1e5955ba7dba'],
];
const fixture=name=>read('tests/fixtures/ae84-review/'+name);
const historicalValidatorPath='F:/VisibleMedicine/staging/20261023-ae84-metadata-closure/website/tests/current-atlas-delivery.mjs';
assert.equal(sha(readFileSync(historicalValidatorPath)),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5','Historical validator source changed');
const {validateCurrentAtlasDelivery:validateHistoricalAe84Delivery}=await import(pathToFileURL(historicalValidatorPath).href);
const historicalReceiptPath='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json';
const historicalReceiptBytes=readFileSync(historicalReceiptPath);
assert.equal(sha(historicalReceiptBytes),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522','Historical source receipt changed');
const historicalReceipt=JSON.parse(historicalReceiptBytes);
assert.equal(historicalReceipt.website,'F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website');
const historicalPin=historicalReviewAe84Pin(read);
const historicalRuntimePaths=['shoulder','lower-limb','female-pelvis'].flatMap(name=>['manifest.json','source-inputs.json'].map(file=>`public/atlas-runtime/${name}/${file}`));
const historicalRuntimeRows=new Map(historicalRuntimePaths.map(p=>{
 const rows=historicalReceipt.sourceRows.filter(row=>row.path===p);
 assert.equal(rows.length,1,'Exactly one old source row: '+p);
 assert.equal(rows[0].sha256,historicalPin.documents[p],'Receipt and ae84 pin agree: '+p);
 return [p,rows[0]];
}));
const historicalLive=p=>{
 const row=historicalRuntimeRows.get(p);if(!row)return read(p);
 const bytes=readFileSync(join(historicalReceipt.website,p));
 assert.equal(bytes.length,row.bytes,'Old source byte length: '+p);
 assert.equal(sha(bytes),row.sha256,'Old source row hash: '+p);
 assert.equal(sha(bytes),historicalPin.documents[p],'Ae84 pin document hash: '+p);
 return bytes;
};
const historical=p=>historicalReviewAe84Read(p,historicalLive);

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
 const packet=validateHistoricalAe84Delivery({pin,read:p=>{seen.push(p);return historical(p);}});
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
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),error=>error?.code==='ERR_ASSERTION'&&error.actual===46&&error.expected===54);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:current,read:historical}),/Current delivery changed/);
 for(const [p,digest]of Object.entries(current.documents))assert.equal(sha(read(p)),digest,p);
});
