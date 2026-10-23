import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const sha=v=>createHash('sha256').update(v).digest('hex');
const originalBytes=readFileSync(new URL('./clinical-review-continuous-guided-playback.original.ts.raw.preimage',import.meta.url));
const original=originalBytes.toString('utf8').replaceAll('\r\n','\n');
const candidate=readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts.preimage',import.meta.url),'utf8').replaceAll('\r\n','\n');
const one=(source,before,after)=>{assert.equal(source.split(before).length,2,'Unique authenticated seam: '+before.slice(0,70));return source.replace(before,after);};
const edits=[
 ["import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';","import {assertHistoricalRenalTourEpoch,assertCurrentTourAdditions,assertCurrentGuidedReviewAdditions} from './tour-playback-source-role.mjs';"],
 ["const playbackCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';","const playbackCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';"],
 ["  assert.equal(imported.regionalTours.length,51);\n  assert.equal(imported.regionalTours.reduce((count:number,tour:any)=>count+tour.steps.length,0),309);","  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);\n  const renal=await exactSourceHistoryApi(reviewedRenalEpoch,'regional-tour-review');\n  assertCurrentTourAdditions(renal.regionalTours,imported.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"],
 ["  const playback=await exactSourceHistoryApi(playbackCommit,'regional-tour-review');","  const playback=await exactSourceHistoryApi(playbackCommit,'regional-tour-review');\n  const renal=await exactSourceHistoryApi(reviewedRenalEpoch,'regional-tour-review');"],
 ["  assertRenalTourEpoch(old.regionalTours,current.regionalTours);\n  assertRenalTourEpoch(epoch.regionalTours,current.regionalTours);","  for(const earlier of [old.regionalTours,epoch.regionalTours])\n    assertHistoricalRenalTourEpoch(earlier,renal.regionalTours,{atlasRoot:atlas,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertCurrentTourAdditions(renal.regionalTours,current.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"],
 ["    const atPlayback=wire(await playback.bodyReviewMaterial(structure.id));","    const atPlayback=wire(await playback.bodyReviewMaterial(structure.id));\n    const atRenal=wire(await renal.bodyReviewMaterial(structure.id));"],
 ["    assert(before&&atEpoch&&atPlayback&&after&&imported,structure.id);packets++;","    assert(before&&atEpoch&&atPlayback&&atRenal&&after&&imported,structure.id);packets++;"],
 ["    assert.deepEqual(after.guidedTours,atEpoch.guidedTours,\n      `${structure.id}: live guide evidence remains exactly the playback epoch`);","    assert.deepEqual(atRenal.guidedTours,atEpoch.guidedTours,\n      `${structure.id}: historical guide evidence remains exactly the playback epoch`);\n    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,after.guidedTours,current.regionalTours);"],
];
test('complete old test source has only eight exact role seams and a byte-exact inverse',()=>{
 assert.equal(sha(originalBytes),'92ffeb69f175623981e443c1d63d43bdb1a6f5a70798553fbadc10999fab1d89');
 let forward=original;
 for(const [before,after] of edits)forward=one(forward,before,after);
 assert.equal(forward,candidate,'Complete candidate equals exact forward role composition');
 let inverse=candidate;
 for(const [before,after] of edits.toReversed())inverse=one(inverse,after,before);
 assert.equal(inverse,original,'Every original assertion and refusal restored');
 assert(candidate.includes('assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);'),'Current parser acceptance remains mandatory');
 assert.notEqual(candidate.replace('assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);',''),forward,'Removing parser gate is refused');
});

const successor=restorePlaybackReasoningRole(readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts',import.meta.url))).toString().replaceAll('\r\n','\n');
const helperPreimageBytes=readFileSync(new URL('./tour-playback-source-role.mjs.preimage',import.meta.url));
const helperPreimage=helperPreimageBytes.toString('utf8').replaceAll('\r\n','\n');
const helperSuccessor=readFileSync(new URL('./tour-playback-source-role.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const successorEdits=[
 ["const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';",
  "const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';\nconst reviewedCurrentCommit='66ac064579ee23c5739d0907e8378e0e2d57d7bd';"],
 ["  const sourceRoot=currentAtlasDeliveryRoot();",
  "  assert.equal(liveCommit,reviewedCurrentCommit,'Website delivery must bind the reviewed parser source');\n  const sourceRoot=currentAtlasDeliveryRoot();"],
 ["  const current=await importedApi(),live=await boundCurrentAtlasHistory(liveCommit);",
  "  assert.equal(liveCommit,reviewedCurrentCommit,'Website delivery must bind the reviewed parser source');\n  const current=await importedApi(),live=await boundCurrentAtlasHistory(liveCommit);"],
];
const helperEdits=[
 ["const currentSource='9eac0806a7869cfae435010b013ae611d748c0c9';\nconst currentTree='1d96d29f65b9739713f2dd51bfccd3bddf6bba52';",
  "const previousSource='9eac0806a7869cfae435010b013ae611d748c0c9';\nconst currentSource='66ac064579ee23c5739d0907e8378e0e2d57d7bd';\nconst currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';"],
 [" assert.equal(tree(atlasRoot,currentSource),currentTree);",
  " assert.equal(tree(atlasRoot,currentSource),currentTree);\n assert.equal(git(atlasRoot,'rev-parse',`${currentSource}^`).toString().trim(),previousSource,'Exact source parent');\n assert.deepEqual(git(atlasRoot,'diff','--name-only',previousSource,currentSource,'--','lib','content','app').toString().trim().split(/\\r?\\n/),\n  ['lib/body-review-response.ts'],'Only the reviewed parser changed in feature, tour and teaching sources');\n for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/hamstring-tours.ts','lib/posterior-calf-tour.ts',\n  'lib/shoulder-tours.ts','lib/body-review-material.ts','lib/body-review-context.ts','app/body-content.ts',\n  'app/regional-guided-learning.tsx','app/review/body/review-dashboard.tsx'])\n  assert.deepEqual(blob(atlasRoot,currentSource,path),blob(atlasRoot,previousSource,path),path+': exact prior feature source');"],
];
test('successor roles have exact test and helper inverses',()=>{
 assert.equal(sha(readFileSync(new URL('./clinical-review-continuous-guided-playback.test.ts.preimage',import.meta.url))),
  '48a051a355f695571cbfd29cf9c8e874e55d14c3ef7fa7495442d585923a95a7');
 assert.equal(sha(helperPreimageBytes),'7deb128dfb905bf7100d81e4f5ac149fae8ad8d83826e172f67a0d07fbf2257a');
 let forward=candidate;for(const [before,after] of successorEdits)forward=one(forward,before,after);
 assert.equal(forward,successor);
 let inverse=successor;for(const [before,after] of successorEdits.toReversed())inverse=one(inverse,after,before);
 assert.equal(inverse,candidate);
 let helperForward=helperPreimage;for(const [before,after] of helperEdits)helperForward=one(helperForward,before,after);
 assert.equal(helperForward,helperSuccessor);
 let helperInverse=helperSuccessor;for(const [before,after] of helperEdits.toReversed())helperInverse=one(helperInverse,after,before);
 assert.equal(helperInverse,helperPreimage);
 assert(successor.includes('assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);'));
 assert(successor.includes('assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);'));
});
