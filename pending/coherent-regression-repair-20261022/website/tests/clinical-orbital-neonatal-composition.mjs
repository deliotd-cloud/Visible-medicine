import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases={
 'clinical-review-orbital-sensory-mri.test.ts':{
  current:'1ab3a584efd8ae9e6f8b386c641398bf393b5a27b0a788e2ed77c9ba8d04e59e',
  frozen:'0fa989b29a130f39264b192358545f9b9d56d602a84c215e82bc76bb875ea28b',
  inverse:[
   ['CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery','CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot'],
   ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
   ['manifest.sourceCommit,runtimeSources[module],module','manifest.sourceCommit,revision,module'],
   ['input?.sha256,sha(git(runtimeSources[module],path)),`${module}: ${path}`','input?.sha256,expected,`${module}: ${path}`'],
  ],
 },
 'clinical-review-short-ciliary-quiz.test.ts':{
  current:'a8a605b6328d8c49d5515d949207921647361e8ac76e640d9c5217c6efd7977f',
  frozen:'d42841bf35bb2dd54320be3d6bbe658bd17e522b49f07763728e1485c85b1f9f',
  inverse:[
   ["import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",''],
   ["const liveCommit=CURRENT_ATLAS_REVISION; // Current committed, integrated Review source revision.","const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9'; // Current committed, integrated source revision."],
   ['const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n',''],
   ['manifest.sourceCommit,runtimeSources[name],name','manifest.sourceCommit,liveCommit,name'],
   ['input?.sha256,sha(committed(runtimeSources[name],path)),`${name}: ${path}`','input?.sha256,sha(source),`${name}: ${path}`'],
  ],
 },
};

// Only these two newly admitted files compose back to their complete frozen
// candidate before the existing historical theorem runs. No old pin changes.
export function restoreFrozenCandidate(name,currentBytes,frozenBytes){
 const entry=Object.hasOwn(cases,name)?cases[name]:undefined;
 assert(entry,`${name}: no admitted composition`);
 assert.equal(sha(currentBytes),entry.current,`${name}: exact new candidate`);
 assert.equal(sha(frozenBytes),entry.frozen,`${name}: exact complete frozen CODE preimage`);
 let recovered=currentBytes.toString('utf8');
 assert.deepEqual(Buffer.from(recovered),currentBytes,`${name}: lossless candidate UTF-8`);
 for(const [now,before] of entry.inverse){
  assert.equal(recovered.split(now).length,2,`${name}: unique inverse seam`);
  recovered=recovered.replace(now,before);
 }
 const result=Buffer.from(recovered);
 assert.deepEqual(result,frozenBytes,`${name}: complete frozen CODE recovered`);
 return result;
}
