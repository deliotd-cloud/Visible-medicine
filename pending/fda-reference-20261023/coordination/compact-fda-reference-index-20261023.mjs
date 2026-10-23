import fs from 'node:fs';import assert from 'node:assert/strict';import {json,read,sha} from './source-only-backup-20261019.mjs';
const file='CURRENT_CHECKPOINT.json',root='F:/VisibleMedicine/recovery/checkpoints/20261023-fda-reference-parent-history';
assert(!fs.existsSync(root));const bytes=read(file),before=json(file),p=structuredClone(before);fs.mkdirSync(root);
fs.writeFileSync(root+'/CURRENT_BEFORE.json',bytes,{flag:'wx'});
const names=['pendingMidfootReasoning','pendingFdaShoulderSource','pendingFdaShoulderSurfaces'];
const fields=Object.fromEntries(names.map(k=>['activeWork.current.'+k,p.activeWork.current[k]]));assert(Object.values(fields).every(Boolean));
const history={schemaVersion:1,at:new Date().toISOString(),originalPointerSha256:sha(bytes),fields,priorArchive:p.historyArchive};
const text=JSON.stringify(history,null,2)+'\n';fs.writeFileSync(root+'/history.json',text,{flag:'wx'});
for(const key of names){const old=p.activeWork.current[key];p.activeWork.current[key]={historicalOnly:true,checkpoint:old.checkpoint,details:root+'/history.json',originalJsonPath:'activeWork.current.'+key,composedInto:old.composedInto??'FDA source-reference successor; latest complete Website remains independent',installed:false};}
const fieldIndex=names.map(k=>({originalJsonPath:'activeWork.current.'+k,archiveJsonPath:'fields.'+'activeWork.current.'+k}));fs.writeFileSync(root+'/field-index.json',JSON.stringify(fieldIndex,null,2)+'\n',{flag:'wx'});
p.historyArchive={path:root+'/history.json',sha256:sha(text),bytes:Buffer.byteLength(text),fieldIndex:root+'/field-index.json',priorArchive:before.historyArchive,allHistoryRetained:true,reason:'Preserve exact composed midfoot and parent FDA source/surface records, not clinical or runtime approval.'};
for(const k of ['goal','safety','coordination'])assert.deepEqual(p[k],before[k]);for(const k of ['ownerPreviewPolicy','currentInstalled','latestWebsiteCandidate','activeExecutionSessions'])assert.deepEqual(p.activeWork.current[k],before.activeWork.current[k]);
for(const [key,value]of Object.entries(before.activeWork.current))if(!names.includes(key))assert.deepEqual(p.activeWork.current[key],value);
for(const key of names)assert.deepEqual(json(root+'/history.json').fields['activeWork.current.'+key],before.activeWork.current[key]);
const after=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(after)<bytes.length&&Buffer.byteLength(after)<62000);fs.writeFileSync(file,after);
const receipt={at:history.at,originalPointerSha256:sha(bytes),currentPointerSha256:sha(after),beforeBytes:bytes.length,afterBytes:Buffer.byteLength(after),history:root+'/history.json',historySha256:sha(text),allOriginalFieldsRetained:true,goalAndSafetyAndOwnerPolicyExact:true};fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
