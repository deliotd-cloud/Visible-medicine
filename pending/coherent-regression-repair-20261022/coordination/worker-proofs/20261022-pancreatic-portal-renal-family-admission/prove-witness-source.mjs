import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {restorePancreaticPortalCandidate} from './proposal/tests/clinical-pancreatic-portal-composition.mjs';
import {restoreWitnessSource} from '../20261022-orbital-neonatal-family-admission/prove-witness-source.mjs';

const root=new URL('.',import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,match=>match.slice(1));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/';
const orbital='F:/VisibleMedicine/staging/20261022-orbital-neonatal-family-admission/proposal/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const batch='clinical-epoch-batch-d-preservation.test.mjs';
const portal='clinical-review-portal-venous-current-admission.test.mjs';
const ui='ui-teaching-admission-contract.test.mjs';
const witnessSeams={
 [batch]:[
  ["import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';\n",''],
  ["  :entry.name==='clinical-review-pancreatic-vessel-teaching.test.ts'\n   ?restorePancreaticPortalCandidate(entry.name,delivered,readFileSync(new URL('./fixtures/pancreatic-portal-frozen/'+entry.name+'.raw',import.meta.url)))\n",''],
 ],
 [portal]:[
  ["import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';\n",''],
  ["const candidate=restorePancreaticPortalCandidate('clinical-review-portal-venous-xray.test.ts',\n readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url)),\n readFileSync(new URL('./fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-xray.test.ts.raw',import.meta.url))).toString('utf8');",
   "const candidate=readFileSync(new URL('./clinical-review-portal-venous-xray.test.ts',import.meta.url),'utf8');"],
 ],
 [ui]:[
  ["import {restorePancreaticPortalCandidate} from './clinical-pancreatic-portal-composition.mjs';\n",''],
  ["const frozenPortalSource=()=>restorePancreaticPortalCandidate('clinical-review-portal-venous-xray.test.ts',\n read('clinical-review-portal-venous-xray.test.ts'),\n read('fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-xray.test.ts.raw'));\nconst frozenPortalWitness=()=>restorePancreaticPortalCandidate('clinical-review-portal-venous-current-admission.test.mjs',\n read('clinical-review-portal-venous-current-admission.test.mjs'),\n read('fixtures/pancreatic-portal-frozen/clinical-review-portal-venous-current-admission.test.mjs.raw'));\n",''],
  ["sha(frozenPortalSource()),'2dc7fe02eba3ed6cee38817b10138bba4ea14e874987db5e66213aea625bab8e'","sha(read('clinical-review-portal-venous-xray.test.ts')),'2dc7fe02eba3ed6cee38817b10138bba4ea14e874987db5e66213aea625bab8e'"],
  ['admitPortalCurrent(frozenPortalWitness().toString(),portalPin);',"admitPortalCurrent(read('clinical-review-portal-venous-current-admission.test.mjs').toString(),portalPin);"],
  ["const portal=frozenPortalWitness().toString();","const portal=read('clinical-review-portal-venous-current-admission.test.mjs').toString();"],
 ],
};
const selectedToFrozen=[
 ["import {restoreFrozenCandidate} from './clinical-orbital-neonatal-composition.mjs';\n",''],
 [" const delivered=readFileSync(new URL('./'+entry.name,import.meta.url));\n const proposed=entry.name==='clinical-review-orbital-sensory-mri.test.ts'\n  ?restoreFrozenCandidate(entry.name,delivered,readFileSync(new URL('./fixtures/orbital-neonatal-frozen/'+entry.name+'.raw',import.meta.url)))\n  :delivered;",
  " const proposed=readFileSync(new URL('./'+entry.name,import.meta.url));"],
];

const hashes=[];
for(const name of [batch,portal,ui]){
 const original=readFileSync(`${root}original/tests/${name}`);
 const proposal=readFileSync(`${root}proposal/tests/${name}`);
 const prior=name===batch?readFileSync(`${orbital}${name}`):readFileSync(`${website}${name}`);
 assert.deepEqual(original,prior,`${name}: exact selected/frozen preimage`);
 assert.deepEqual(restoreWitnessSource(proposal.toString('utf8'),witnessSeams[name],sha(original)),original,`${name}: complete inverse`);
 assert.throws(()=>restoreWitnessSource(proposal.toString('utf8')+'FOREIGN',witnessSeams[name],sha(original)),`${name}: appended mutant refusal`);
 const first=witnessSeams[name][0][0];
 assert.throws(()=>restoreWitnessSource(proposal.toString('utf8').replace(first,first+'FOREIGN'),witnessSeams[name],sha(original)),`${name}: changed seam refusal`);
 hashes.push({witness:name,original:sha(original),proposal:sha(proposal)});
}
const selected=readFileSync(`${root}original/tests/${batch}`);
const fullFrozen=readFileSync(`${root}original/frozen/${batch}.raw`);
assert.deepEqual(fullFrozen,readFileSync(`${website}${batch}`));
assert.deepEqual(restoreWitnessSource(selected.toString('utf8'),selectedToFrozen,sha(fullFrozen)),fullFrozen,'Batch D selected 7707 → full frozen c934');
assert.throws(()=>restoreWitnessSource(selected.toString('utf8')+'FOREIGN',selectedToFrozen,sha(fullFrozen)),'Batch D historic mutant refused');

for(const name of ['clinical-review-pancreatic-vessel-teaching.test.ts','clinical-review-portal-venous-xray.test.ts',portal]){
 const current=readFileSync(`${root}proposal/tests/${name}`);
 const frozen=readFileSync(`${root}proposal/tests/fixtures/pancreatic-portal-frozen/${name}.raw`);
 assert.deepEqual(frozen,readFileSync(`${website}${name}`),`${name}: authentic full frozen CODE`);
 assert.deepEqual(restorePancreaticPortalCandidate(name,current,frozen),frozen,`${name}: actual adapter success`);
 assert.throws(()=>restorePancreaticPortalCandidate(name,Buffer.concat([current,Buffer.from('FOREIGN')]),frozen),`${name}: candidate mutant refusal`);
 assert.throws(()=>restorePancreaticPortalCandidate(name,current,Buffer.concat([frozen,Buffer.from('FOREIGN')])),`${name}: fixture mutant refusal`);
 hashes.push({candidate:name,current:sha(current),frozen:sha(frozen)});
}
console.log(JSON.stringify({hashes,batchChain:[sha(readFileSync(`${root}proposal/tests/${batch}`)),sha(selected),sha(fullFrozen)],pure:true},null,2));
