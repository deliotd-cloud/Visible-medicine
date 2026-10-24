// Compact current index; preserve omitted history at original JSON paths.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const target='CURRENT_CHECKPOINT.json',before=fs.readFileSync(target),c=JSON.parse(before);
const dir='F:/VisibleMedicine/recovery/checkpoints/20261024-upper-vascular-index-history';
assert(!fs.existsSync(dir));fs.mkdirSync(dir);
const fields=['currentCandidateEditorialAudit','pendingLegacyShoulderReferences'];
const originalFields=Object.fromEntries(fields.map(k=>['activeWork.current.'+k,c.activeWork.current[k]]));
const history={at:new Date().toISOString(),previousArchive:c.historyArchive,originalFields};
fs.writeFileSync(dir+'/history.json',JSON.stringify(history,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dir+'/CURRENT_BEFORE.json',before,{flag:'wx'});
const archiveSha256=hash(dir+'/history.json');
for(const key of fields){
 const old=c.activeWork.current[key];
 c.activeWork.current[key]={checkpoint:old.checkpoint,checkpointSha256:old.checkpointSha256,source:old.source,historyPath:dir+'/history.json',historySha256:archiveSha256,originalJsonPath:'activeWork.current.'+key,historicalNotCurrentAcceptance:true};
}
c.historyArchive={path:dir+'/history.json',sha256:archiveSha256,fieldIndex:dir+'/field-index.json',allHistoryRetained:true,priorArchiveIn:'previousArchive',readPolicy:'Read original JSON paths only for relevant older facts. Missing details never imply approval, completion or permission.'};
c.activeWork.current.pendingUpperVascularReasoning={stage:'F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning',parentHead:'cf9b5091db90219981929f6a9cbfdf1056bac9d6',phase:'Authored10 concepts/20exact source targets; focused native validation pending the Release Reliability slot handoff.',installed:false,previewChanged:false};
c.coordination.releaseChat.cursor='09786c67-a526-4f3e-9592-4f73d6c47d39:46';
const after=JSON.stringify(c,null,2)+'\n';assert(Buffer.byteLength(after)<65536);
for(const p of ['goal','safety','ownerWithdrawnHistoryPolicy'])assert.deepEqual(c[p],json(target)[p]);
assert.deepEqual(c.activeWork.current.ownerPreviewPolicy,json(target).activeWork.current.ownerPreviewPolicy);
assert.deepEqual(c.activeWork.current.currentInstalled,json(target).activeWork.current.currentInstalled);
assert.deepEqual(c.activeWork.current.latestWebsiteCandidate,json(target).activeWork.current.latestWebsiteCandidate);
assert.deepEqual(json(dir+'/history.json').originalFields,originalFields);
fs.writeFileSync(dir+'/field-index.json',JSON.stringify(Object.keys(originalFields),null,2)+'\n',{flag:'wx'});
fs.copyFileSync('index-upper-vascular-work-20261024.mjs',dir+'/RECIPE.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(target,after);fs.writeFileSync(dir+'/CURRENT_AFTER.json',after,{flag:'wx'});
console.log(JSON.stringify({bytes:Buffer.byteLength(after),archiveSha256,previewChanged:false}));
