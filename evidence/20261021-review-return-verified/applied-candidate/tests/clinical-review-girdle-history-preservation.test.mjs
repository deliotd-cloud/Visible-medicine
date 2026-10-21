import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const original=readFileSync(new URL('./fixtures/clinical-review-girdle-muscle-xray-original.ts.raw',import.meta.url));
const proposed=readFileSync(new URL('./clinical-review-girdle-muscle-xray.test.ts',import.meta.url));
const edits=[
 ["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';",
  "import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"],
 ["const atlas='F:/VisibleMedicine/atlas';",'const atlas=currentAtlasDeliveryRoot();'],
 ['// The introduction epoch remains fixed. A later integration may repin only liveCommit.',
  '// The introduction and first delivery epochs are immutable Git history.'],
 ["const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';",
  "const historicalCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst liveCommit=CURRENT_ATLAS_REVISION;"],
 [" assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);",
  " assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);\n assert.equal(checkedAtlasHistoryRepo(historicalCommit),atlas);\n assert.equal(git(['merge-base',completedEpoch,historicalCommit]).toString().trim(),completedEpoch);\n assert.equal(git(['merge-base',historicalCommit,liveCommit]).toString().trim(),historicalCommit);"],
 ["  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),`${path}: source epoch retained`);",
  "  assert.deepEqual(committed(historicalCommit,path),committed(completedEpoch,path),`${path}: source epoch retained`);\n for(const path of [helperPath,contentPath])\n  assert.deepEqual(committed(liveCommit,path),committed(historicalCommit,path),`${path}: current source retained`);"],
 [" const epoch=await exactSourceHistoryApi(completedEpoch,'review-security');",
  " const epoch=await exactSourceHistoryApi(completedEpoch,'review-security');\n const retained=await exactSourceHistoryApi(historicalCommit,'review-security');"],
 ["   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);",
  "   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);\n   const firstDelivery=retained.bodyLesson(structure,tab);"],
 ["    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');",
  "    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');\n    assert.deepEqual(firstDelivery,historical,`${structure.id}:${tab}: first delivery retains introduction`);"],
 ["    assert.deepEqual(after,current.girdleMuscleXrayLesson(structure,tab));",
  "    assert.deepEqual(after,current.girdleMuscleXrayLesson(structure,tab));\n    assert.deepEqual(after,firstDelivery,`${structure.id}:${tab}: current girdle lesson retains first delivery`);"],
 ["  const historical=wire(await epoch.bodyReviewMaterial(structure.id));",
  "  const historical=wire(await epoch.bodyReviewMaterial(structure.id));\n  const firstDelivery=wire(await retained.bodyReviewMaterial(structure.id));"],
 ["  assert.equal(historical.fingerprints.source,before.fingerprints.source);",
  "  assert.equal(historical.fingerprints.source,before.fingerprints.source);\n  assert.deepEqual(firstDelivery.topics.find((row:any)=>row.tab==='xray'),\n   historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: first delivery girdle worksheet`);"],
];

function verify(bytes){
 assert.equal(sha(original),'0e9acbdf4079b27520a30de4ad4efc257463260196e2199b219db454c3752e77');
 const originalText=original.toString('utf8'),proposedText=bytes.toString('utf8');
 assert.deepEqual(Buffer.from(originalText),original,'Lossless original UTF-8');
 assert.deepEqual(Buffer.from(proposedText),bytes,'Lossless proposed UTF-8');
 let reconstructed=originalText;
 for(const [before,after] of edits){
  assert.equal(reconstructed.split(before).length,2,'Exactly one declared original seam');
  reconstructed=reconstructed.replace(before,after);
 }
 assert.equal(proposedText,reconstructed,'No removed historical assertion or undeclared edit');
 for(const [before,after] of [...edits].reverse()){
  assert.equal(reconstructed.split(after).length,2,'Exactly one declared inverse seam');
  reconstructed=reconstructed.replace(after,before);
 }
 assert.deepEqual(Buffer.from(reconstructed),original,'Entire original test restored byte for byte');
}

test('whole original girdle theorem has an exact declared current-epoch inverse',()=>verify(proposed));

test('girdle theorem refuses a removed assertion or substituted epoch',()=>{
 const text=proposed.toString('utf8');
 for(const changed of [text.replace('assert.equal(', 'assert.notEqual('),
  text.replace('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','0'.repeat(40))]){
  assert.notEqual(changed,text);
  assert.throws(()=>verify(Buffer.from(changed)));
 }
});
