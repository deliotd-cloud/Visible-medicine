// Serial whole-catalog comparison; uses the verified unchanged parent snapshot.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-upper-cervical-reasoning',oldFile='F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning/candidate-snapshot.json',parentProof=json('F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning/PRESERVATION.json');
assert.equal(hash(oldFile),parentProof.candidateSnapshotSha256);
const before=json(oldFile),after=json(stage+'/candidate-snapshot.json'),ids=new Set(json(stage+'/atlas/content/upper-cervical-reasoning-pins.json').entries.map(e=>e.identity.id));
assert.equal(before.rows.length,1104);assert.equal(after.rows.length,1104);assert.equal(before.concepts.length,193);assert.equal(after.concepts.length,197);assert.deepEqual(after.concepts.slice(0,193),before.concepts);assert.equal(after.catalog,before.catalog);
let changed=0,unchanged=0,sessions=0,placements=0;for(const b of before.rows){const a=after.rows.find(r=>r.id===b.id);assert(a);for(const k of ['id','source','topics','topicCount','tours','checklist','approval','status'])assert.deepEqual(a[k],b[k],b.id+':'+k);placements+=a.topicCount;
 if(ids.has(b.id)){assert.equal(b.hasQuestion,false);assert.equal(a.hasQuestion,true);assert.notEqual(a.reasoning,b.reasoning);assert.notEqual(a.fingerprints.teaching,b.fingerprints.teaching);changed++;}
 else{for(const k of ['reasoning','fingerprints','session','hasQuestion','materialHash'])assert.deepEqual(a[k],b[k],b.id+':'+k);unchanged++;}
 if(b.hasQuestion){assert.equal(a.session,b.session);sessions++;}
}
assert.equal(changed,8);assert.equal(unchanged,1096);assert.equal(sessions,346);assert.equal(placements,9936);
const report={at:new Date().toISOString(),baseline:oldFile,baselineSha256:hash(oldFile),candidate:stage+'/candidate-snapshot.json',candidateSha256:hash(stage+'/candidate-snapshot.json'),priorConceptsPreserved:193,concepts:197,priorSessionsPreserved:346,sourceSelections:354,changedTeachingWorksheets:changed,unchangedTeachingWorksheets:unchanged,unchangedTopicPlacements:placements,sourceGeometryAndChecklistsUnchanged:true,privateDecisionsRead:false,clinicalApproval:false,previewChanged:false};
fs.writeFileSync(stage+'/PRESERVATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
