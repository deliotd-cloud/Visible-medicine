import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldAtlasRoot="export function currentAtlasDeliveryRoot(){\n validateCurrentAtlasDelivery();\n return frozenAtlasRoot();\n}";
const realAtlasRoot="export function currentAtlasDeliveryRoot(){\n validateCurrentAtlasDelivery();\n // This closed delivery still validates a real clean historical HEAD/tree.\n // Never pass the active current checkout off as the archived source.\n const previous=process.env.VM_ATLAS_SOURCE_REPO;\n try{\n  process.env.VM_ATLAS_SOURCE_REPO=process.env.VM_CLOSED_ATLAS_46C_SOURCE??'F:/VisibleMedicine/staging/20261020-closed46c-atlas-source';\n  return frozenAtlasRoot();\n }finally{\n  if(previous===undefined)delete process.env.VM_ATLAS_SOURCE_REPO;\n  else process.env.VM_ATLAS_SOURCE_REPO=previous;\n }\n}";
const edits=[
 ["import {fileURLToPath} from 'node:url';","import {checkedHistoricalWebsiteRoot} from './historical-website-root.mjs';"],
 ["const site=new URL('../',import.meta.url);\nconst liveRoot=process.env.VM_WEBSITE_ROOT??fileURLToPath(site);\n",''],
 ["export const revision57=JSON.parse(fixed('current-atlas-delivery-57.json','f65de9d27cc04e2d09aa27429dc285c077bf27d15823c9533e7f0b2158efc91c'));","export const revision57=JSON.parse(fixed('current-atlas-delivery-57.json','f65de9d27cc04e2d09aa27429dc285c077bf27d15823c9533e7f0b2158efc91c'));\nexport const oldWebsiteRoot=checkedHistoricalWebsiteRoot(57,revision57);"],
 ["readLive=p=>readFileSync(join(liveRoot,p))","readLive=p=>readFileSync(join(oldWebsiteRoot,p))"],
 [oldAtlasRoot,realAtlasRoot],
];

test('closed57 reader preserves its original source with only declared real-root seams',()=>{
 const actual=readFileSync(new URL('./historical-current-atlas-delivery-57.mjs',import.meta.url),'utf8');
 let inverse=actual;
 for(const [from,to] of edits.toReversed()){
  if(to===''){const anchor='const fixed=(path,digest)=>{';assert.equal(inverse.split(anchor).length,2,anchor);inverse=inverse.replace(anchor,from+anchor);}
  else{assert.equal(inverse.split(to).length,2,to);inverse=inverse.replace(to,from);}
 }
 // The independently verified entire pre-repair file is the authority; no
 // redundant dated archive/fixture dependency or unchecked text is needed.
 assert.equal(sha(Buffer.from(inverse)),'1f01aa5084580ee0a8b114d23662995b107a2034fa8697647dec88ce32f911e8','Complete old57 reader source inverse');
 let forward=inverse;
 for(const [from,to] of edits){assert.equal(forward.split(from).length,2,from);forward=forward.replace(from,to);}
 assert.equal(forward,actual,'Only the declared seams reconstruct the complete current helper');
 const originalAssertion="assert.equal(oldInputs.size,1661);";
 assert(inverse.includes(originalAssertion));
 assert.notEqual(sha(Buffer.from(inverse.replace(originalAssertion,'assert.equal(oldInputs.size,1660);'))),'1f01aa5084580ee0a8b114d23662995b107a2034fa8697647dec88ce32f911e8','An original assertion mutation breaks the full inverse');
});
