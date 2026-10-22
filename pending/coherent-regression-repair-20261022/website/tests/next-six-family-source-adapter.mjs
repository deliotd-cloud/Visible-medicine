import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases={
 'clinical-review-digestive-tract-tour.test.ts':{
  current:'7e54b0afc98c2ae9c85fe53deb2f59f249a056068e9de670efbbec8fc49c75ce',
  prior:'44895bc96595267e82b9ab915bda847b54bc1cef2f9453b99eeac9d70287fc85',
  seams:[
   ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
   [" const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(currentRevision,deliveryPin.source,'Review stays bound to current source');\n",''],
   ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
    'assert.equal(manifest.sourceCommit,currentRevision,module);'],
  ],
 },
 'clinical-review-facial-bone-xray.test.ts':{
  current:'948180a70f5807a501382caed0852a6d228c57284401204855fa4a9492db3239',
  prior:'8c9cf3f38635d47ac1309dc8e7693f948b04df54840cce7ecb20226b12913247',
  seams:[
   ["import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
   [" const deliveryPin=validateCurrentAtlasDelivery();\n assert.equal(currentRevision,deliveryPin.source,'Review stays bound to current source');\n",''],
   ['assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);',
    'assert.equal(manifest.sourceCommit,currentRevision,module);'],
  ],
 },
};
export const nextSixFamilyNames=Object.freeze(Object.keys(cases));
export function restoreNextSixCurrentSource(name,bytes){
 const item=cases[name];assert(item,'Only two admitted family-source transitions');
 assert.equal(sha(bytes),item.current,'Exact family-aware current source: '+name);
 const original=readFileSync(new URL('./fixtures/next-six-family-current/'+name+'.raw',import.meta.url));
 assert.equal(sha(original),item.prior,'Exact complete prior source: '+name);
 let restored=Buffer.from(bytes).toString('utf8');
 for(const [current,prior] of item.seams){
  assert.equal(restored.split(current).length,2,'Unique family seam: '+name);
  restored=restored.replace(current,prior);
 }
 const result=Buffer.from(restored);
 assert.deepEqual(result,original,'Complete current-to-prior source inverse: '+name);
 return result;
}
