import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
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
const successorEdits=[
 ["const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';",
  "const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';\nconst reviewedCurrentCommit='66ac064579ee23c5739d0907e8378e0e2d57d7bd';"],
 ["  const sourceRoot=currentAtlasDeliveryRoot();",
  "  assert.equal(liveCommit,reviewedCurrentCommit,'Website delivery must bind the reviewed parser source');\n  const sourceRoot=currentAtlasDeliveryRoot();"],
 ["  const current=await importedApi(),live=await boundCurrentAtlasHistory(liveCommit);",
  "  assert.equal(liveCommit,reviewedCurrentCommit,'Website delivery must bind the reviewed parser source');\n  const current=await importedApi(),live=await boundCurrentAtlasHistory(liveCommit);"],
];
/** Restore every complete prior assertion, including authentic CRLF bytes. */
export function restorePlaybackSourceRole(bytes){
 bytes=restorePlaybackReasoningRole(bytes);
 assert.equal(sha(bytes),'e22ed14aad0078dedcbca0bd4b5f7dddebf5bf67563e740f91a13d155e7e2daa','Exact reviewed successor, not a widened pattern');
 let source=Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
 for(const [before,after]of [...edits,...successorEdits].toReversed()){
  assert.equal(source.split(after).length,2,'Unique exact inverse seam');source=source.replace(after,before);
 }
 const restored=Buffer.from(source.replaceAll('\n','\r\n'));
 assert.equal(sha(restored),'92ffeb69f175623981e443c1d63d43bdb1a6f5a70798553fbadc10999fab1d89','Whole original test, not a replacement witness');
 return restored;
}

/** Remove only this new consumer composition before the older keyboard proof. */
export function restorePlaybackPreservationConsumer(bytes){
 assert.equal(sha(bytes),'b7ae9527cab549c1af47985b08dc03e22b730660ec08ef0db69cbf4c3bd37efd','Exact reviewed consumer composition');
 let source=Buffer.from(bytes).toString();
 const edits=[["import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';","import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';\nimport {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';"],["function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);","function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);if(row.path==='tests/clinical-review-continuous-guided-playback.test.ts')bytes=restorePlaybackSourceRole(bytes);"]];
 for(const [before,after]of edits.toReversed()){
  assert.equal(source.split(after).length,2,'Exact consumer inverse seam');source=source.replace(after,before);
 }
 const restored=Buffer.from(source);assert.equal(sha(restored),'5ea736ccb86faee5f8b012dbf266c89b79d141a64262e08bbb05c0379e7fbcf8');return restored;
}
