import fs from 'node:fs';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-spine-hand-teaching-audit';
const atlas='F:/VisibleMedicine/staging/20261026-quick-check-focus-native/atlas';
const website='F:/VisibleMedicine/staging/20261026-workbook-history-website/website';
const baseline='F:/VisibleMedicine/staging/20261015-completion-audit/root-teaching-gaps.json';
const original=json(baseline),current=json(stage+'/CURRENT_ROOT_REPORT.json');
assert.equal(current.sourceRevision,'643fd47491a41a0207f106806c17035cb938048b');
assert.equal(current.evidence.workingTreeDirty,false);
assert.equal(execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),current.sourceRevision);
assert.equal(execFileSync('git',['-C',atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true}).trim(),'');
const selected=original.rows.filter(r=>['spine','hand'].includes(r.region)&&r.topic==='xray'&&r.readiness==='pending');
assert.equal(selected.length,100); assert.equal(selected.filter(r=>r.region==='spine').length,62);
assert.equal(selected.filter(r=>r.region==='hand').length,38);
const snapshots=new Map(), files=[];
for(const region of ['spine','hand']){
  const file=atlas+'/content/regional-teaching/'+region+'.json',copy=website+'/atlas-review/content/regional-teaching/'+region+'.json';
  assert.equal(hash(file),hash(copy)); const data=json(file);assert.equal(data.region,region);
  files.push({region,path:file,sha256:hash(file),websiteCopy:copy,entries:data.entries.length});
  for(const e of data.entries){const id=JSON.parse(e.identity).id;assert(!snapshots.has(id));snapshots.set(id,e);}
}
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rows=selected.map(row=>{
  const entry=snapshots.get(row.id);assert(entry,'Original target is still present: '+row.id);
  const lesson=entry.lessons.xray;assert.equal(lesson.readiness,'draft');assert(lesson.body.trim());
  assert(lesson.citations.length>0);assert(lesson.citations.every(url=>new URL(url).protocol==='https:'));
  assert(!current.rows.some(r=>r.id===row.id&&r.topic==='xray'),'Current resolver agrees that this target is draft');
  return{id:row.id,region:row.region,baseline:'pending',current:'draft',identitySha256:sha(entry.identity),lessonSha256:sha(lesson),citationCount:lesson.citations.length};
});
const report={at:new Date().toISOString(),baseline:{path:baseline,sha256:hash(baseline),source:original.sourceRevision},current:{path:stage+'/CURRENT_ROOT_REPORT.json',sha256:hash(stage+'/CURRENT_ROOT_REPORT.json'),source:current.sourceRevision},files,rows,
  originalTargets:100,currentDraftTargets:100,missingTargets:0,currentPendingXrayInTheseRegions:0,
  allRootTotals:current.totals,scope:'Original 62 spine and 38 hand root X-ray placements, reconciled by stable ID against current resolver and byte-identical native/website exports. Counts are teaching placements, not unique authored lessons, geometry completeness or clinical approval.',
  clinicalApproval:false,referenceMedicalAccuracyReviewPerformed:false,normalPreviewChanged:false};
assert.equal(current.rows.filter(r=>['spine','hand'].includes(r.region)&&r.topic==='xray'&&r.readiness==='pending').length,0);
fs.writeFileSync(stage+'/RECONCILIATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
const verification={at:new Date().toISOString(),passingForStatedScope:true,scope:report.scope,evidence:{path:stage+'/RECONCILIATION.json',sha256:hash(stage+'/RECONCILIATION.json')},originalTargets:100,currentDraftTargets:100,sourceAndWebsiteExportAgreement:true,allStatusesUnchanged:true,clinicalApproval:false,normalPreviewChanged:false};
fs.writeFileSync(stage+'/VERIFICATION_SUMMARY.json',JSON.stringify(verification,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verifiedTargets:100,currentPendingXray:0,verification:stage+'/VERIFICATION_SUMMARY.json',sha256:hash(stage+'/VERIFICATION_SUMMARY.json')}));
