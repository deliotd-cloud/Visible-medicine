import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';
import {restorePlaybackReasoningRole} from './playback-reasoning-epoch.mjs';
import {restoreArterialPreservationConsumer} from './arterial-current-role-inverse.mjs';
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
 bytes=restoreAdjacentSharedRole('tests/clinical-review-continuous-guided-playback.test.ts',bytes);
 assert.equal(sha(bytes),'5b6614bf7aa0d511e54a9a38562be8ad6bbfdc03fd79c1d7af0314fe0d3e50f7',
  'Exact latest reasoning-source playback consumer');
 let reasoning=bytes.toString().replaceAll('\r\n','\n');
 const restore=(after,before)=>{assert.equal(reasoning.split(after).length,2,'One exact reasoning role seam');reasoning=reasoning.replace(after,before);};
 restore("  const reasoningRevision='aa13c067197cad87bd0a9b2da5549bc4b33bfdf7';\n  const reasoning=await exactSourceHistoryApi(reasoningRevision,'regional-tour-review');\n",'');
 restore("  assert.deepEqual(committed(liveCommit,'lib/reasoning-questions.ts'),committed(reasoningRevision,'lib/reasoning-questions.ts'),\n    'Current reasoning equals the exact reviewed lower-limb arterial source');\n",'');
 restore("  for(const path of ['lib/body-reasoning-review.ts','lib/carpal-relationships-reasoning.ts','content/carpal-relationships-reasoning-pins.json'])",
  "  for(const path of ['lib/reasoning-questions.ts','lib/body-reasoning-review.ts','lib/carpal-relationships-reasoning.ts','content/carpal-relationships-reasoning-pins.json'])");
 restore("    assert.deepEqual(after.reasoning,wire(await reasoning.bodyReviewMaterial(structure.id)).reasoning,'Current reasoning equals the exact later source worksheet');",
  "    assert.deepEqual(after.reasoning,wire(await carpal.bodyReviewMaterial(structure.id)).reasoning,'Current reasoning equals the exact later carpal-source worksheet');");
 bytes=Buffer.from(reasoning.replaceAll('\n','\r\n'));
 assert.equal(sha(bytes),'8ba67d1665cf18648337586bbce4397805b6da0a9425d5d8142ce38c88aa2fe3',
  'Exact latest-source playback consumer');
 let latest=bytes.toString().replaceAll('\r\n','\n');
 const latestImport="import {assertHistoricalRenalTourEpoch,assertLatestTourDelivery,assertCurrentGuidedReviewAdditions} from './tour-playback-source-role.mjs';";
 const priorImport="import {assertHistoricalRenalTourEpoch,assertCurrentTourAdditions,assertCurrentGuidedReviewAdditions} from './tour-playback-source-role.mjs';";
 assert.equal(latest.split(latestImport).length,2);
 latest=latest.replace(latestImport,priorImport);
 const latestPin="const reviewedCurrentCommit='5e75b9ce7e46fed291748108edd7565c97dee101';";
 const priorPin="const reviewedCurrentCommit='66ac064579ee23c5739d0907e8378e0e2d57d7bd';";
 assert.equal(latest.split(latestPin).length,2);
 latest=latest.replace(latestPin,priorPin);
 const latestCall='assertLatestTourDelivery(renal.regionalTours,';
 const priorCall='assertCurrentTourAdditions(renal.regionalTours,';
 assert.equal(latest.split(latestCall).length,3);
 latest=latest.replaceAll(latestCall,priorCall);
 bytes=Buffer.from(latest.replaceAll('\n','\r\n'));
 assert.equal(sha(bytes),'ec0b983804dbf82fa318d9958f8241766c05452c9246d2914318e4fda482c0b3',
  'Complete reviewed parser-era consumer restored');
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
 bytes=restoreArterialPreservationConsumer(bytes);
 assert.equal(sha(bytes),'b7ae9527cab549c1af47985b08dc03e22b730660ec08ef0db69cbf4c3bd37efd','Exact reviewed consumer composition');
 let source=Buffer.from(bytes).toString();
 const edits=[["import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';","import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';\nimport {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';"],["function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);","function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);if(row.path==='tests/clinical-review-continuous-guided-playback.test.ts')bytes=restorePlaybackSourceRole(bytes);"]];
 for(const [before,after]of edits.toReversed()){
  assert.equal(source.split(after).length,2,'Exact consumer inverse seam');source=source.replace(after,before);
 }
 const restored=Buffer.from(source);assert.equal(sha(restored),'5ea736ccb86faee5f8b012dbf266c89b79d141a64262e08bbb05c0379e7fbcf8');return restored;
}
