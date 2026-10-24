import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function restoreLowerLimbCurrentRole(bytes){
 assert.equal(sha(bytes),'c848b411bd7b92e91e47dbfb0c9c9829131ead5bd64feb5ffe7f78e7f90ea829',
  'Exact current and historical source-role consumer');
 let source=bytes.toString();
 for(const [after,before] of [
  [" assert.equal(hash(epoch.structures),before.shoulderHash,'Historical structure identity remains exact at the connective epoch');",
   ' assert.equal(hash(live.structures),before.shoulderHash);'],
  [" assert.equal(hash(epoch.dissectionProfiles),before.dissectionHash,'Historical dissection profiles remain exact at the connective epoch');",
   ' assert.equal(hash(live.dissectionProfiles),before.dissectionHash);'],
 ]){
  assert.equal(source.split(after).length,2,'One exact historical-source seam');
  source=source.replace(after,before);
 }
 bytes=Buffer.from(source);
 assert.equal(sha(bytes),'f93ca80d80d7be167bbbba31355ef5b129ef52ccf7a88ebae7fb2127061d10c5',
  'Exact current lower-limb source');
 const after=" assert.equal(currentPin.runtimeSources.shoulder,revision,'Current shoulder runtime follows the exact current Atlas source');";
 const before=' assert.equal(currentPin.runtimeSources.shoulder,priorRevision);';
 source=bytes.toString();assert.equal(source.split(after).length,2,'One exact current runtime seam');
 const restored=Buffer.from(source.replace(after,before));
 assert.equal(sha(restored),'dea27b090f230482979e97ec1ff54b5343f8c830885a0e49d09a69e7e5cc2fa6',
  'Whole previous lower-limb source restored');
 return restored;
}
