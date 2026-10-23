// Preserve obsolete duplicated payloads at their original JSON paths, F-drive only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const file='CURRENT_CHECKPOINT.json',root='F:/VisibleMedicine/recovery/checkpoints/20261023-current-index-compaction';
const sha=b=>createHash('sha256').update(b).digest('hex');
const before=fs.readFileSync(file),p=JSON.parse(before),old=structuredClone(p);
assert.equal(p.goal.status,'active');assert.equal(p.goal.requirements,71);assert.equal(p.goal.optionalIdeas,8);
assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(root));fs.mkdirSync(root);
fs.writeFileSync(root+'/CURRENT_BEFORE.json.raw',before,{flag:'wx'});
const paths=['completeReleaseFollowups','indexCompaction'];
const archived={schema:'vm.coordination-history/1',activeWork:{current:{}},previousArchive:p.historyArchive};
for(const key of paths){assert(Object.hasOwn(p.activeWork.current,key));archived.activeWork.current[key]=p.activeWork.current[key];}
const history=Buffer.from(JSON.stringify(archived,null,2)+'\n');fs.writeFileSync(root+'/history.json',history,{flag:'wx'});
const fieldIndex={originalPaths:paths.map(k=>'activeWork.current.'+k),previousArchive:p.historyArchive.path,allOtherOriginalFieldsRemainInPointer:true};
fs.writeFileSync(root+'/archived-field-index.json',JSON.stringify(fieldIndex,null,2)+'\n',{flag:'wx'});
const record={at:new Date().toISOString(),beforePath:root+'/CURRENT_BEFORE.json.raw',beforeSha256:sha(before),beforeBytes:before.length,archive:root+'/history.json',archiveSha256:sha(history),archivedPaths:fieldIndex.originalPaths,fullGoal71AndEightPreserved:true,ownerPreviewPolicyPreserved:true,sourceOrInstalledStateChanged:false,remoteBackupClaim:false};
const receipt=Buffer.from(JSON.stringify(record,null,2)+'\n');fs.writeFileSync(root+'/checkpoint.json',receipt,{flag:'wx'});
p.activeWork.current.completeReleaseFollowups={historicalOnly:true,checkpoint:old.activeWork.current.completeReleaseFollowups.checkpoint,details:root+'/history.json',originalJsonPath:'activeWork.current.completeReleaseFollowups',note:'Obsolete nonterminal observations retained, not live handles. Current terminal stock run and later verified successors remain indexed separately.'};
p.activeWork.current.indexCompaction={checkpoint:root+'/checkpoint.json',sha256:sha(receipt),originalPointerSha256:sha(before),allHistoryRetained:true};
p.historyArchive={path:root+'/history.json',sha256:sha(history),bytes:history.length,allHistoryRetained:true,fieldIndex:root+'/archived-field-index.json',priorArchive:old.historyArchive,reason:'Archive obsolete duplicated follow-up/process payloads without dropping any original field, full goal, owner policy, candidate/installed distinction or current handle.'};
for(const key of ['goal','safety','coordination'])assert.deepEqual(p[key],old[key]);
for(const [key,value]of Object.entries(old.activeWork.current))if(!paths.includes(key))assert.deepEqual(p.activeWork.current[key],value);
for(const key of paths)assert.deepEqual(JSON.parse(fs.readFileSync(root+'/history.json')).activeWork.current[key],old.activeWork.current[key]);
const after=Buffer.from(JSON.stringify(p,null,2)+'\n');assert(after.length<before.length&&after.length<65536);
fs.writeFileSync(file,after);assert.equal(sha(fs.readFileSync(file)),sha(after));
fs.writeFileSync(root+'/FINAL.json',JSON.stringify({at:new Date().toISOString(),pointerSha256:sha(after),beforeBytes:before.length,afterBytes:after.length,allOtherFieldsByteValueEquivalent:true,archivedFieldsExact:true,goalStatus:p.goal.status},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/checkpoint.json',sha256:sha(receipt),beforeBytes:before.length,afterBytes:after.length,allHistoryRetained:true,goalPreserved:true}));
