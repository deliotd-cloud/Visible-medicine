import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const config=json(process.argv[2]);
const root=path.resolve(config.checkpointRoot).replaceAll('\\','/');
assert(root.startsWith('F:/VisibleMedicine/recovery/checkpoints/'));
const checkpoint=json(root+'/checkpoint.json');assert.equal(sha(read(root+'/checkpoint.json')),config.checkpointSha256);
assert.equal(checkpoint.canonicalInstalled,false);
assert(checkpoint.wholeSuitePassingClaim===false||checkpoint.fullSuitePassingClaim===false);
assert.notEqual(checkpoint.wholeSuitePassingClaim,true);assert.notEqual(checkpoint.fullSuitePassingClaim,true);
const remote=json(checkpoint.backup.receipt);assert(remote.sourceBackupVerified);
assert.equal(sha(read(checkpoint.backup.receipt)),checkpoint.backup.receiptSha256);
const pointerText=read('CURRENT_CHECKPOINT.json').toString(),pointer=JSON.parse(pointerText),active=pointer.activeWork;
assert.equal(active.source,checkpoint.source);assert.equal(active.review,checkpoint.review);
const schemaAt=pointerText.indexOf('  "schema":');assert(schemaAt>0);
const activePatch=config.activeWorkPatch??{};
assert(Object.keys(activePatch).every(key=>['queuedMilestone','queuedUiMilestone','proposalQueue','localCutoverInventory','canonicalDeveloperTooling'].includes(key)));
const runtime={};
if(config.nativeObservation){
 const observation=config.nativeObservation;
 assert(/^F:\/VisibleMedicine\/staging\/20261021-(?:current-source-matrix|head-specimen-actual-native|current-source-matrix-followup(?:-v2)?)$/.test(observation.stage));
 const started=json(observation.stage+'/STARTED.json');assert.equal(started.source,checkpoint.source);assert.equal(started.review,checkpoint.review);
 if(fs.existsSync(observation.stage+'/MATRIX_RESULT.json')){
  const result=json(observation.stage+'/MATRIX_RESULT.json');assert.equal(sha(read(result.log)),result.logSha256);
  assert.equal(result.sourceInputsUnchanged,true);assert.equal(result.source,checkpoint.source);assert.equal(result.review,checkpoint.review);
  Object.assign(runtime,{stage:observation.stage,sessionId:null,processesAtObservation:[],nativeResult:observation.stage+'/MATRIX_RESULT.json',nativeResultSha256:sha(read(observation.stage+'/MATRIX_RESULT.json')),nativeCounts:result.counts});
 }else{
  assert(Number.isSafeInteger(observation.sessionId)&&observation.sessionId>0);
  process.kill(started.driver,0);process.kill(started.pid,0);
  Object.assign(runtime,{stage:observation.stage,sessionId:observation.sessionId,processesAtObservation:[started.driver,started.pid],nativeResult:null,nativeResultSha256:null,nativeCounts:null});
 }
}
const updated={...active,...activePatch,...runtime,updated:new Date().toISOString(),result:root+'/checkpoint.json',checkpoint:root+'/checkpoint.json',
 checkpointSha256:config.checkpointSha256,state:config.state,next:config.next,
 newFilesBackup:{head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths,receipt:checkpoint.backup.receipt,
 receiptSha256:checkpoint.backup.receiptSha256,proposalOnly:checkpoint.canonicalDeveloperToolingInstalled!==true,containsAppliedDeveloperTooling:checkpoint.canonicalDeveloperToolingInstalled===true,wholeProjectBackup:false,privateDataBackup:false},
 fullGoalActive:true};
const files=[['CURRENT_CHECKPOINT.json','{\n  "activeWork": '+JSON.stringify(updated,null,2).replaceAll('\n','\n  ')+',\n'+pointerText.slice(schemaAt)]];
const checklistPath='F:/VisibleMedicine/website/docs/completion-checklist.json';
const checklist=json(checklistPath),before=json(root+'/coordination-before/completion-checklist.json');
assert.equal(checklist.revision,config.expectedRevision);assert.deepEqual(checklist.items,before.items);assert.deepEqual(checklist.baseline,before.baseline);
checklist.revision++;checklist.pendingAtlasSource.evidence=root+'/checkpoint.json';
checklist.pendingAtlasSource.note='websiteImported=false still means not installed in the canonical baseline. '+config.state;
checklist.changeLog.unshift({date:new Date().toISOString().slice(0,10),revision:checklist.revision,change:config.state});
files.push([checklistPath,JSON.stringify(checklist,null,2)+'\n']);
for(const p of ['WORKSPACE_MAP.md','F:/VisibleMedicine/website/docs/master-plan.md']){
 const original=read(p).toString().replaceAll('\r\n','\n');assert(original.startsWith(config.expectedCurrentTitle));
 files.push([p,config.title+'\n\nRead CURRENT_CHECKPOINT.json.activeWork first. '+config.state+'\n\nNext: '+config.next+'\n\n'+original.replace(/^## Current:/,'## Previous:')]);
}
const patch=['*** Begin Patch'];
for(const [p,content]of files){
 const target=path.resolve(p).replaceAll('\\','/'),proposed=root+'/coordination-proposed/'+path.basename(p);
 fs.mkdirSync(path.dirname(proposed),{recursive:true});fs.writeFileSync(proposed,content,{flag:'wx'});
 const diff=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',target,proposed],{encoding:'utf8',windowsHide:true,maxBuffer:8e6});assert.equal(diff.status,1);
 const lines=diff.stdout.replaceAll('\r\n','\n').split('\n'),start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
 patch.push('*** Update File: '+target,...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
}
patch.push('*** End Patch');console.log(patch.join('\n'));
