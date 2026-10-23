import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[["  const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));","  const carpalRevision='5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7';\r\n  const carpal=await exactSourceHistoryApi(carpalRevision,'regional-tour-review');\r\n  for(const path of ['lib/reasoning-questions.ts','lib/body-reasoning-review.ts','lib/carpal-relationships-reasoning.ts','content/carpal-relationships-reasoning-pins.json'])\r\n    assert.deepEqual(committed(liveCommit,path),committed(carpalRevision,path),'Current reasoning equals the exact reviewed carpal source: '+path);\r\n  const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));"],["    assert.deepEqual(after.reasoning,before.reasoning);","    assert.deepEqual(atPlayback.reasoning,before.reasoning,'Original playback changed no reasoning');\r\n    assert.deepEqual(after.reasoning,wire(await carpal.bodyReviewMaterial(structure.id)).reasoning,'Current reasoning equals the exact later carpal-source worksheet');"],["    assert.deepEqual(atRenal.guidedTours,atEpoch.guidedTours,","    assert.deepEqual(atPlayback.guidedTours,atEpoch.guidedTours, /* playback epoch only */"]];
export function restorePlaybackReasoningRole(bytes){
 assert.equal(sha(bytes),'ec0b983804dbf82fa318d9958f8241766c05452c9246d2914318e4fda482c0b3','Exact current reasoning-role source');
 let source=Buffer.from(bytes).toString();
 for(const [before,after]of edits.toReversed()){assert.equal(source.split(after).length,2);source=source.replace(after,before);}
 const restored=Buffer.from(source);assert.equal(sha(restored),'e22ed14aad0078dedcbca0bd4b5f7dddebf5bf67563e740f91a13d155e7e2daa');return restored;
}
