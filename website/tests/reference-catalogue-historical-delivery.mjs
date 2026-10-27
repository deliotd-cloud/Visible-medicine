// Test-only closure of the exact ae84 metadata graph. Never admits live delivery.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {historicalReviewAe84Pin,historicalReviewAe84Read} from './historical-review-ae84.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=name=>readFileSync(new URL('./fixtures/reference-catalogue-epoch/'+name,import.meta.url));
const files=new Map([
 ['public/atlas-runtime/shoulder/manifest.json','shoulder-manifest.json.raw'],
 ['public/atlas-runtime/shoulder/source-inputs.json','shoulder-source-inputs.json.raw'],
 ['public/atlas-runtime/lower-limb/manifest.json','lower-limb-manifest.json.raw'],
 ['public/atlas-runtime/lower-limb/source-inputs.json','lower-limb-source-inputs.json.raw'],
 ['public/atlas-runtime/female-pelvis/manifest.json','female-pelvis-manifest.json.raw'],
 ['public/atlas-runtime/female-pelvis/source-inputs.json','female-pelvis-source-inputs.json.raw'],
]);

export function historicalReferenceDelivery(readLive,{readFixture=fixture,readAe84=historicalReviewAe84Read}={}){
 const pin=historicalReviewAe84Pin(readLive);
 const witness=readFixture('validator.mjs.raw');
 assert.equal(sha(witness),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5','Authentic ae84 validator');
 const source=witness.toString('utf8'),start=source.indexOf('const modules='),fn=source.indexOf('export function validateCurrentAtlasDelivery('),end=source.indexOf('// Consumers cannot silently accept',fn);
 assert(start>=0&&fn>start&&end>fn,'Exact historical validator boundaries');
 const validate=new Function('assert','createHash','readFileSync','websiteRoot','defaultPin',source.slice(start,fn)+'\n'+source.slice(fn,end).replace(/^export function /,'function ')+'\nreturn validateCurrentAtlasDelivery;')(assert,createHash,readFileSync,'',null);
 const admitted=new Map();
 for(const [path,digest]of Object.entries(pin.documents)){
  const bytes=files.has(path)?readFixture(files.get(path)):readAe84(path,()=>assert.fail('Historical metadata cannot fall back to live: '+path));
  assert.equal(sha(bytes),digest,'Exact ae84 document: '+path);
  admitted.set(path,Buffer.from(bytes));
 }
 const read=path=>{assert(admitted.has(path),'Only authenticated historical metadata may be read');return Buffer.from(admitted.get(path));};
 validate({pin,read});
 return read;
}
