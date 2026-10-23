import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning';
const before=JSON.parse(fs.readFileSync(stage+'/baseline-snapshot.json')),after=JSON.parse(fs.readFileSync(stage+'/candidate-snapshot.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(before.concepts.length,190);assert.equal(after.concepts.length,193);assert.deepEqual(after.concepts.slice(0,190),before.concepts);
assert.equal(after.catalog,before.catalog);assert.equal(before.rows.length,1104);assert.equal(after.rows.length,1104);
const targets=['choroid-plexus-of-cerebral-hemisphere','mammillary-body','lamina-terminalis'].map(s=>'vm:anatomy:body:head-neck:midline:organ:'+s);
let changed=0,unchanged=0,placements=0,oldSessions=0;for(let i=0;i<before.rows.length;i++){
 const b=before.rows[i],a=after.rows[i];assert.equal(a.id,b.id);
 for(const k of ['source','topics','tours','checklist','approval','status'])assert.deepEqual(a[k],b[k],a.id+':'+k);
 assert.equal(a.approval,false);assert.equal(a.status,'worksheet-not-submitted');assert.equal(a.fingerprints.source,b.fingerprints.source);assert.equal(a.fingerprints.checklist,b.fingerprints.checklist);placements+=a.topicCount;
 if(targets.includes(a.id)){assert.equal(b.hasQuestion,false);assert.equal(a.hasQuestion,true);assert.notEqual(a.reasoning,b.reasoning);assert.notEqual(a.fingerprints.teaching,b.fingerprints.teaching);assert.notEqual(a.materialHash,b.materialHash);changed++;}
 else{assert.deepEqual(a,b,a.id+': unaffected complete worksheet/session hash record');unchanged++;}
 if(b.hasQuestion){assert.equal(a.session,b.session,a.id+': prior session exact');oldSessions++;}
}
assert.equal(changed,3);assert.equal(unchanged,1101);assert.equal(placements,9936);assert.equal(oldSessions,343);
const report={at:new Date().toISOString(),parentCommit:'ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f',baselineSnapshotSha256:sha(fs.readFileSync(stage+'/baseline-snapshot.json')),candidateSnapshotSha256:sha(fs.readFileSync(stage+'/candidate-snapshot.json')),priorConceptsPreserved:190,concepts:193,previousSessionsPreserved:343,sourceSelections:346,changedTeachingWorksheets:changed,unchangedTeachingWorksheets:unchanged,unchangedTopicPlacements:placements,sourceGeometryAndChecklistsUnchanged:true,privateDecisionsRead:false,clinicalApproval:false,previewChanged:false};
fs.writeFileSync(stage+'/PRESERVATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
