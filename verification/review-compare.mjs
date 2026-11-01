import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/staging/20261101-renal-native-integration';
const read=name=>JSON.parse(fs.readFileSync(root+'/'+name));
const before=read('REVIEW_BEFORE.json'),after=read('REVIEW_AFTER.json');
for(const packet of [before,after])for(const input of packet.inputs)
  assert.equal(createHash('sha256').update(fs.readFileSync(packet.root+'/'+input.path)).digest('hex'),input.sha256,input.path);
assert.equal(before.rows.length,108);assert.equal(after.rows.length,108);
const changedTeaching=[],changedGeometry=[];
for(let n=0;n<before.rows.length;n++){
  const a=before.rows[n],b=after.rows[n];assert.equal(a.id,b.id);assert.equal(a.key,b.key);
  assert.equal(a.sourceHash,b.sourceHash);assert.equal(a.context.sourceHash,b.context.sourceHash);
  assert.equal(a.context.sourceFrame,b.context.sourceFrame);assert.equal(a.context.checklistVersion,b.context.checklistVersion);
  assert.deepEqual(a.context.checklists,b.context.checklists);assert.deepEqual(a.context.blockers,b.context.blockers);
  assert.equal(b.context.revisions.imaging,null);
  assert.notEqual(a.context.rendererHash,b.context.rendererHash);assert.notEqual(a.context.materialHash,b.context.materialHash);
  if(a.context.revisions.geometry!==b.context.revisions.geometry)changedGeometry.push(b.id);
  if(a.context.revisions.teaching!==b.context.revisions.teaching){
    changedTeaching.push(b.id);assert.notEqual(a.teachingHash,b.teachingHash);
    assert(['renal-veins','renal-suprarenal-veins'].includes(b.concept));
    assert.equal(a.context.teachingTabs.includes('xray'),false);
    assert.deepEqual(b.context.teachingTabs.filter(tab=>tab!=='xray'),a.context.teachingTabs);
    assert.equal(b.context.teachingTabs.indexOf('xray'),b.context.teachingTabs.indexOf('mri')+1);
  }else{assert.equal(a.teachingHash,b.teachingHash);assert.deepEqual(a.context.teachingTabs,b.context.teachingTabs);}
}
assert.equal(changedGeometry.length,108,'Conservative global renderer review invalidation must remain');
assert.deepEqual(changedTeaching.sort(),[
  'vm:anatomy:body:abdomen:left:vessel:left-renal-vein',
  'vm:anatomy:body:abdomen:left:vessel:left-suprarenal-vein',
  'vm:anatomy:body:abdomen:right:vessel:right-renal-vein',
  'vm:anatomy:body:abdomen:right:vessel:right-suprarenal-vein',
]);
const report={contexts:108,changedTeaching:4,unchangedTeaching:104,changedGeometryReviewRevisions:108,sourceGeometryUnchanged:true,imagingRevisionsAbsent:true,decisionsReadOrWritten:false,clinicalApproval:false};
fs.writeFileSync(root+'/REVIEW_COMPARISON.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
