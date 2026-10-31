import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const original=readFileSync(new URL('./fixtures/clinical-review-axillary-branch-xray.original.ts.raw',import.meta.url));
const candidate=readFileSync(new URL('./clinical-review-axillary-branch-xray.test.ts',import.meta.url));
const changes=[
 ["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';", "import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"],
 ["const atlas='F:/VisibleMedicine/atlas';", 'const atlas=currentAtlasDeliveryRoot();'],
 ["const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';", 'const liveCommit=CURRENT_ATLAS_REVISION;'],
 [" {timeout:180000},async()=>{\n assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);", " {timeout:180000},async()=>{\n const admission=validateCurrentAtlasDelivery();\n assert.equal(admission.source,liveCommit);\n assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);"],
 ["assert.equal(manifest.sourceCommit,liveCommit,name);", "assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);"],
 ["if(inLearner)assert.equal(input?.sha256,sha(original),`${name}: ${path}`);", "if(inLearner)assert.equal(input?.sha256,\n    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);"],
 ["assert.deepEqual(current.structures,live.structures);assert.deepEqual(live.structures,old.structures);", "assert.deepEqual(current.structures,live.structures);assert.deepEqual(epoch.structures,old.structures);"],
 ["assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);", "assert.deepEqual(epoch.dissectionProfiles,old.dissectionProfiles);"],
 ["assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(live.regionalTours,old.regionalTours);", "assert.deepEqual(current.regionalTours,live.regionalTours);assertRenalTourEpoch(old.regionalTours,live.regionalTours);"],
 ["assert.equal(current.regionalTours.length,51);", "assert.equal(current.regionalTours.length,55);"],
 ["assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),309);", "assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),327);"],
];
const raw=original.toString('utf8');
let expected=raw;
for(const [before,after] of changes){
 assert.equal(expected.split(before).length,2,`exact single declared seam: ${before}`);
 expected=expected.replace(before,after);
}
const prove=bytes=>assert.deepEqual(bytes,Buffer.from(expected,'utf8'));
const changed=(before,after)=>Buffer.from(candidate.toString('utf8').replace(before,after),'utf8');

test('whole original and candidate differ only at declared current-admission and authenticated renal-tour seams',()=>{
 prove(candidate);
 assert.equal(original.includes(Buffer.from("const baseline='ec9972a60325de147277941e04089e2d4be0baf9';")),true);
 assert.equal(original.includes(Buffer.from("const completedEpoch='787993e4497fe1de282569e3f4f611baff061206';")),true);
 assert.equal(original.includes(Buffer.from('assert.equal(current.regionalTours.length,51);')),true);
 assert.equal(original.includes(Buffer.from('assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),309);')),true);
 assert.equal(candidate.toString('utf8').match(/\r\n/g)?.length??0,original.toString('utf8').match(/\r\n/g)?.length??0);
});
test('historical baseline and introduction tampering break byte preservation',()=>{
 assert.throws(()=>prove(changed('ec9972a60325de147277941e04089e2d4be0baf9','f5097af8493701d64a8e2a2b5797df380f3b348a')));
 assert.throws(()=>prove(changed('787993e4497fe1de282569e3f4f611baff061206','f5097af8493701d64a8e2a2b5797df380f3b348a')));
});
test('current Review and tour assertions cannot be removed by this admission repair',()=>{
 assert.throws(()=>prove(changed('assert.deepEqual(current.regionalTours,live.regionalTours);','')));
 assert.throws(()=>prove(changed('assertRenalTourEpoch(old.regionalTours,live.regionalTours);','')));
 assert.throws(()=>prove(changed('assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,','')));
});
test('direct literal admission or removed source validator breaks byte preservation',()=>{
 assert.throws(()=>prove(changed('const liveCommit=CURRENT_ATLAS_REVISION;',"const liveCommit='f5097af8493701d64a8e2a2b5797df380f3b348a';")));
 assert.throws(()=>prove(changed('const atlas=currentAtlasDeliveryRoot();',"const atlas='F:/VisibleMedicine/atlas';")));
});
