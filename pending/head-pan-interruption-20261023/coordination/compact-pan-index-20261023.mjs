// Archive only duplicated composed proposals; preserve full original JSON paths.
import fs from 'node:fs';import assert from 'node:assert/strict';import {json,read,sha} from './source-only-backup-20261019.mjs';
const file='CURRENT_CHECKPOINT.json',root='F:/VisibleMedicine/recovery/checkpoints/20261023-pan-index-compaction';
assert(!fs.existsSync(root));const bytes=read(file),before=json(file),p=structuredClone(before);fs.mkdirSync(root);
fs.writeFileSync(root+'/CURRENT_BEFORE.json',bytes,{flag:'wx'});
const names=['pendingStudioSessionDrafts','pendingInboxFailureFocus','pendingUiRecoveryIntegrated'];
const fields=Object.fromEntries(names.map(k=>['activeWork.current.'+k,p.activeWork.current[k]]));assert(Object.values(fields).every(Boolean));
const history={schemaVersion:1,at:new Date().toISOString(),originalPointerSha256:sha(bytes),fields,priorArchive:p.historyArchive};
const text=JSON.stringify(history,null,2)+'\n';fs.writeFileSync(root+'/history.json',text,{flag:'wx'});
for(const key of names){const old=p.activeWork.current[key];p.activeWork.current[key]={historicalOnly:true,checkpoint:old.checkpoint,details:root+'/history.json',originalJsonPath:'activeWork.current.'+key,composedInto:old.composedInto??old.supersededForFutureWorkBy,installed:false};}
const fieldIndex=names.map(k=>({originalJsonPath:'activeWork.current.'+k,archiveJsonPath:'fields.'+'activeWork.current.'+k}));fs.writeFileSync(root+'/field-index.json',JSON.stringify(fieldIndex,null,2)+'\n',{flag:'wx'});
p.historyArchive={path:root+'/history.json',sha256:sha(text),bytes:Buffer.byteLength(text),fieldIndex:root+'/field-index.json',priorArchive:before.historyArchive,allHistoryRetained:true,reason:'Archive exact already-composed proposal details at their original JSON paths; retain current installed/candidate/goal/owner-policy distinctions.'};
for(const k of ['goal','safety'])assert.deepEqual(p[k],before[k]);for(const k of ['ownerPreviewPolicy','latestWebsiteCandidate','pendingDigitalVeinUltrasound','activeExecutionSessions'])assert.deepEqual(p.activeWork.current[k],before.activeWork.current[k]);
const after=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(after)<Buffer.byteLength(bytes));assert(Buffer.byteLength(after)<65536);fs.writeFileSync(file,after);
const receipt={at:history.at,originalPointerSha256:sha(bytes),currentPointerSha256:sha(after),beforeBytes:bytes.length,afterBytes:Buffer.byteLength(after),history:root+'/history.json',historySha256:sha(text),allOriginalFieldsRetained:true,goalAndSafetyAndOwnerPolicyExact:true};fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
