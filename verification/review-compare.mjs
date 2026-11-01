import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const evidence=process.env.VM_FOCUS_RUN_DIR;assert(evidence&&fs.existsSync(evidence));
const read=name=>JSON.parse(fs.readFileSync(evidence+'/'+name));
const before=read('REVIEW_BEFORE.json'),after=read('REVIEW_AFTER.json');
for(const packet of [before,after])for(const input of packet.inputs)
 assert.equal(createHash('sha256').update(fs.readFileSync(packet.root+'/'+input.path)).digest('hex'),input.sha256,input.path);
assert.equal(before.rows.length,108);assert.equal(after.rows.length,108);
let changedGeometry=0,changedMaterial=0;
for(let n=0;n<108;n++){
 const a=before.rows[n],b=after.rows[n],ac=a.context,bc=b.context;
 assert.equal(a.id,b.id);assert.equal(a.key,b.key);assert.equal(a.concept,b.concept);
 assert.equal(a.sourceHash,b.sourceHash);assert.equal(a.teachingHash,b.teachingHash);
 assert.equal(ac.sourceHash,bc.sourceHash);assert.equal(ac.sourceFrame,bc.sourceFrame);
 assert.equal(ac.checklistVersion,bc.checklistVersion);
 assert.deepEqual(ac.checklists,bc.checklists);assert.deepEqual(ac.blockers,bc.blockers);
 assert.deepEqual(ac.teachingTabs,bc.teachingTabs);
 assert.deepEqual(ac.revisions.teaching,bc.revisions.teaching);
 assert.deepEqual(ac.revisions.imaging,bc.revisions.imaging);
 assert.notEqual(ac.rendererHash,bc.rendererHash);
 if(ac.materialHash!==bc.materialHash)changedMaterial++;
 if(ac.revisions.geometry!==bc.revisions.geometry)changedGeometry++;
}
assert.equal(changedGeometry,108,'Global renderer invalidation must cover all review contexts');
assert.equal(changedMaterial,108,'Global renderer change must invalidate all review materials');
const report={contexts:108,unchangedSourceHashes:108,unchangedTeachingHashes:108,unchangedTeachingTabs:108,unchangedTeachingAndImagingRevisions:108,changedGeometryReviewRevisions:108,changedMaterialHashes:108,clinicalApproval:false};
fs.writeFileSync(evidence+'/REVIEW_COMPARISON.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
