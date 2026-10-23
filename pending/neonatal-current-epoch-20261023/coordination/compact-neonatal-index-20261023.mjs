// Archive already-composed proposals at their original paths; no goal reduction.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261023-neonatal-index-compaction',file='CURRENT_CHECKPOINT.json';
assert(!fs.existsSync(root));const bytes=read(file),before=json(file),p=structuredClone(before);fs.mkdirSync(root);
const names=['pendingWindowDragInterruption','pendingHeadPanInterruption','pendingAtlasRuntimeRollforward'];
const fields=Object.fromEntries(names.map(k=>['activeWork.current.'+k,p.activeWork.current[k]]));assert(Object.values(fields).every(Boolean));
fs.writeFileSync(root+'/CURRENT_BEFORE.json',bytes,{flag:'wx'});
const history={schemaVersion:1,at:new Date().toISOString(),originalPointerSha256:sha(bytes),fields,priorArchive:p.historyArchive};
const text=JSON.stringify(history,null,2)+'\n';fs.writeFileSync(root+'/history.json',text,{flag:'wx'});
for(const k of names){const old=p.activeWork.current[k];p.activeWork.current[k]={historicalOnly:true,checkpoint:old.checkpoint,details:root+'/history.json',originalJsonPath:'activeWork.current.'+k,composedInto:old.composedInto??p.activeWork.current.latestWebsiteCandidate.sourceReceipt,installed:false};}
fs.writeFileSync(root+'/field-index.json',JSON.stringify(names.map(k=>({originalJsonPath:'activeWork.current.'+k,archiveJsonPath:'fields.'+'activeWork.current.'+k})),null,2)+'\n',{flag:'wx'});
p.historyArchive={path:root+'/history.json',sha256:sha(text),bytes:Buffer.byteLength(text),fieldIndex:root+'/field-index.json',priorArchive:before.historyArchive,allHistoryRetained:true,reason:'Exact completed/composed proposal payloads remain at original paths; current full candidate, pending drafts, full goal and owner policies stay live.'};
for(const k of ['goal','safety'])assert.deepEqual(p[k],before[k]);for(const k of ['ownerPreviewPolicy','latestWebsiteCandidate','pendingDigitalVeinUltrasound','pendingCranialXrayEpoch','activeExecutionSessions'])assert.deepEqual(p.activeWork.current[k],before.activeWork.current[k]);
const after=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(after)<bytes.length);assert(Buffer.byteLength(after)<65536);fs.writeFileSync(file,after);
const receipt={at:history.at,priorSha256:sha(bytes),currentSha256:sha(after),beforeBytes:bytes.length,afterBytes:Buffer.byteLength(after),history:root+'/history.json',historySha256:sha(text),allOriginalFieldsRetained:true,fullGoalAndOwnerPoliciesExact:true};fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
