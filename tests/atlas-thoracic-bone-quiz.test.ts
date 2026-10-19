import assert from 'node:assert/strict';
import {preMCAImportBytes} from './atlas-mca-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {thoracicQuizHostProof} from './atlas-thoracic-bone-quiz-proof.ts';
import {carpalQuizMilestoneBytes,thoracicQuizMilestoneBytes} from './atlas-thoracic-bone-quiz-history.ts';
const revision='bfaaa27e85ca62864e7e1f9a62c72f79c5608a98';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const added=['content/thoracic-bone-quiz-pins.json','content/thoracic-bone-quiz.ts','lib/thoracic-bone-quiz.ts'];
const marker='\n## Thoracic-bone quick checks — 2 October 2026\n';
const addition=()=>{const notice=thoracicQuizMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();return notice.slice(notice.indexOf(marker));};
function withoutSavedNotice(text:string,old:string,milestone:string,prefix='',suffix=''){
 if(text===prefix+old+suffix)return text;
 assert.equal(text,prefix+milestone+suffix,'Earlier credits, exact quiz append, or suffix changed');
 return prefix+old+suffix;
}

test('thoracic questions reach contained learner and protected review with unchanged models/access',()=>{
 const review=JSON.parse(thoracicQuizMilestoneBytes('atlas-review/manifest.json').toString()),prior=JSON.parse(carpalQuizMilestoneBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,960);assert.deepEqual(review.packages,prior.packages);
 const epoch=review;
 assert.deepEqual(epoch.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),added);
 assert.deepEqual(epoch.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 const preMCA=JSON.parse(preMCAImportBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(preMCA.files.map((f:any)=>f.path),epoch.files.map((f:any)=>f.path));
 assert.deepEqual(preMCA.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/fitted-camera.tsx','content/body-renderer-revision.json','content/review-revisions.json']);
 for(const f of review.files)assert.equal(sha(thoracicQuizMilestoneBytes('atlas-review/'+f.path)),f.importedSha256,f.path);
 const pins=JSON.parse(thoracicQuizMilestoneBytes('atlas-review/content/thoracic-bone-quiz-pins.json').toString());assert.equal(pins.entries.length,27);
 for(const name of ['head-neck','shoulder','lower-limb','protected']){
  const folder=name==='protected'?'public/atlas-review-viewer/':'public/atlas-runtime/'+name+'/';
  const manifest=JSON.parse(thoracicQuizMilestoneBytes(folder+'manifest.json').toString()),old=JSON.parse(carpalQuizMilestoneBytes(folder+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest[name==='protected'?'personalRecordsIncluded':'patientDataIncluded'],false);
  for(const f of manifest.files)assert.equal(sha(thoracicQuizMilestoneBytes(folder+f.path)),f.sha256,f.path);
  if(name==='protected')assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
  else{
   for(const flag of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],old[flag]);
   assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),old.files.filter((f:any)=>f.path.startsWith('models/')));
   assert.equal(JSON.parse(thoracicQuizMilestoneBytes(folder+'source-inputs.json').toString()).length,({'head-neck':933,shoulder:619,'lower-limb':100} as Record<string,number>)[name]);
  }
  const noticePath=folder+(name==='protected'?'THIRD_PARTY_NOTICES.txt':'LICENSES/THIRD_PARTY_NOTICES.md');
  const previousNotice=carpalQuizMilestoneBytes(noticePath).toString();
  const expectedNotice=name==='protected'?previousNotice.replace('Atlas source: '+prior.revision,'Atlas source: '+revision):previousNotice;
  const milestoneNotice=thoracicQuizMilestoneBytes(noticePath).toString();
  assert.equal(milestoneNotice.split(addition()).length,2,'One exact quiz notice');
  assert.equal(milestoneNotice.replace(addition(),''),expectedNotice,'Earlier and later credits unchanged');
  assert.equal(withoutSavedNotice(milestoneNotice,expectedNotice,milestoneNotice),expectedNotice);
 }
 // Delivery checks supplement, not replace, the actual resolver/review proof.
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-runtime/shoulder/','public/atlas-review-viewer/']){
  const m=JSON.parse(thoracicQuizMilestoneBytes(folder+'manifest.json').toString());const code=m.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>thoracicQuizMilestoneBytes(folder+f.path).toString()).join('\n').replace(/\\u([0-9a-fA-F]{4})/g,(_:string,h:string)=>String.fromCharCode(parseInt(h,16)));
  for(const entry of pins.entries){
   assert(code.includes(entry.identity.id));assert(code.includes(entry.identity.fmaId));
  }
  for(const text of ['Which distinguishes the first rib?','Thoracic bone quick check','No anterior sternal or upper-cartilage connection'])assert(code.includes(text),folder+text);
 }
 assert.deepEqual(JSON.parse(thoracicQuizMilestoneBytes('lib/atlas-model-inventory.json').toString()).models,JSON.parse(carpalQuizMilestoneBytes('lib/atlas-model-inventory.json').toString()).models);
});

test('27 source-bound draft quizzes preserve other topics/nested content and reject stale review before storage',async()=>{
 const proof=await thoracicQuizHostProof();assert.equal(proof.selections,1104);assert.equal(proof.changedTopics,27);
 assert.equal(proof.unchangedTopics,9909);assert.equal(proof.reviewPackets,27);assert.equal(proof.rejectedPackets,1107);
 assert.equal(proof.staleRejectedBeforeStorage,1131);assert.equal(proof.clinicalApproval,false);
 let nested=0;const {api,before}=proof;assert.deepEqual(api.nestedReviewRows,before.nestedReviewRows);
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const current=await api.nestedReviewMaterial(group.key,row.id),old=await before.nestedReviewMaterial(group.key,row.id);
  assert.deepEqual(current.source,old.source);assert.deepEqual(current.teaching,old.teaching);
  assert.equal(current.context.revisions.imaging,null);nested++;
 }
 assert.equal(nested,108);
});

test('thoracic notice replay preserves earlier credits/suffixes and rejects altered/duplicate/foreign append',()=>{
 const current=thoracicQuizMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString(),old=carpalQuizMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert.equal(sha(Buffer.from(addition())),'ae9718302d2174518f6b60aaddb1f42baec1592dff98a9c5f4a54482f71a1300');
 assert.equal(withoutSavedNotice(current,old,current),old);assert.equal(withoutSavedNotice(old,old,current),old);
 const suffix='\nAdditional dependency notice\n',prefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 assert.equal(withoutSavedNotice(prefix+current+suffix,old,current,prefix,suffix),prefix+old+suffix);
 assert.throws(()=>withoutSavedNotice('Foreign prefix\n'+current,old,current));
 assert.throws(()=>withoutSavedNotice(prefix.replace(revision,'0'.repeat(40))+current,old,current,prefix));
 assert.throws(()=>withoutSavedNotice(current.replace('Nine original formative questions','Altered formative questions'),old,current));
 assert.throws(()=>withoutSavedNotice(current+'\n## Thoracic-bone quick checks — 2 October 2026\n',old,current));
});
