// Main-owned source proposal recovery. No production cutover or deployment.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);};
const index=p=>{const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);return Buffer.byteLength(text);};
function checkRoots(c){assert(c.root.startsWith('F:/VisibleMedicine/recovery/checkpoints/')&&!c.root.includes('..'));assert(c.stage.startsWith('F:/VisibleMedicine/staging/')&&!c.stage.includes('..'));}
export function saveProposal(c){
 checkRoots(c);c.verify();assert(!fs.existsSync(c.root));fs.mkdirSync(c.root);
 const before=json('CURRENT_CHECKPOINT.json');assert.equal(before.goal.status,'active');assert.equal(before.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 for(const[from,to]of [['CURRENT_CHECKPOINT.json','CURRENT_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']])copy(from,c.root+'/'+to);
 write(c.stage+'/MAIN_REVIEW.json',c.review);copy(c.stage+'/MAIN_REVIEW.json',c.root+'/MAIN_REVIEW.json');
 for(const r of c.rows){assert.equal(sha(read(c.site+'/'+r.path)),r.sha256);copy(c.site+'/'+r.path,c.root+'/source/'+r.path);}
 for(const[from,to]of c.localArtifacts){assert(!path.isAbsolute(to)&&!to.split(/[\\/]/).includes('..'));copy(from,c.root+'/evidence/'+to);}
 assert.equal(sha(read(c.parent.receipt)),c.parent.receiptSha256);const parent=json(c.parent.receipt);assert(parent.sourceBackupVerified&&parent.strictIntegrity);
 const old=JSON.parse(runGit(['--git-dir='+c.parent.repo,'show',parent.head+':.source-backup/manifest.json']));
 const selected=new Map(old.files.map(r=>[r.path,path.dirname(c.parent.receipt)+'/remote-source-restored/'+r.path]));
 for(const[name,from]of c.remoteArtifacts){assert(!name.split(/[\\/]/).includes('..')&&!path.isAbsolute(name));assert(/\.(?:mjs|ts|tsx|raw)$/.test(name),'Only explicitly selected code/preimage text, not generated metadata');
  new TextDecoder('utf-8',{fatal:true}).decode(read(from));const key='pending/'+c.id+'/'+name;assert(!selected.has(key));copy(from,c.root+'/backup-source/'+name);selected.set(key,c.root+'/backup-source/'+name);}
 const files=[...selected].map(([name,from])=>({path:name,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
 const verifySource=()=>{c.verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256);const p=json('CURRENT_CHECKPOINT.json');for(const k of ['goal','safety','historyArchive'])assert.deepEqual(p[k],before[k]);assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,before.activeWork.current.ownerPreviewPolicy);};
 const backupRoot=c.root+'-source-backup';let saved;
 try{saved=backup({root:backupRoot,repo:c.backupRepo,branch:'backup/'+c.id,parent:parent.head,parentRepo:c.parent.repo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,sourceIdentity:c.sourceIdentity,scope:c.backupScope,
  proof:{mainReviewSha256:sha(read(c.stage+'/MAIN_REVIEW.json')),...c.proof,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false}});
 }catch(error){fs.mkdirSync(backupRoot,{recursive:true});write(backupRoot+'/backup-failure.json',{at:new Date().toISOString(),message:error.message,independentlyVerified:false});}
 verifySource();const receipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
 const sourceBackup={receipt,receiptSha256:sha(read(receipt)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false};
 const checkpoint={at:new Date().toISOString(),milestone:c.milestone,mainReview:c.stage+'/MAIN_REVIEW.json',mainReviewSha256:sha(read(c.stage+'/MAIN_REVIEW.json')),sourceRows:c.rows,sourceBackup,proof:c.proof,pending:c.pending,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,full71AndEightIdeasPreserved:true};
 write(c.root+'/checkpoint.json',checkpoint);const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current[c.key]={checkpoint:c.root+'/checkpoint.json',checkpointSha256:sha(read(c.root+'/checkpoint.json')),stage:c.stage,sourcePaths:c.rows.length,sourceBackup,...c.summary,previewChanged:false,installed:false};
 if(c.coordinationUpdate)Object.assign(p.coordination.releaseChat,c.coordinationUpdate);p.activeWork.updated=checkpoint.at;index(p);
 return{checkpoint:c.root+'/checkpoint.json',sha256:sha(read(c.root+'/checkpoint.json')),sourceBackup};
}
export function finalizeProposal(c){
 checkRoots(c);c.verify();const before=json(c.root+'/CURRENT_BEFORE.json');
 const documents=[['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']].map(([file,pre])=>{const old=read(c.root+'/'+pre),now=read(file),offset=now.indexOf(old);assert(offset>0);assert.equal(offset+old.length,now.length);return{file,sha256:sha(now),priorSha256:sha(old),wholePriorPreserved:true};});
 const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
 const processes=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"@(Get-CimInstance Win32_Process -Filter 'ProcessId=164336 OR ProcessId=136616 OR ProcessId=240252'|Select-Object ProcessId,ParentProcessId,Name,CreationDate)|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true})||'[]');
 const p=json('CURRENT_CHECKPOINT.json');for(const k of ['goal','safety','historyArchive'])assert.deepEqual(p[k],before[k]);assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,before.activeWork.current.ownerPreviewPolicy);
 const live=processes.length===3&&processes.every(r=>r.Name==='node.exe')&&processes.find(r=>r.ProcessId===136616)?.ParentProcessId===164336&&processes.find(r=>r.ProcessId===240252)?.ParentProcessId===136616;
 const observation={at:new Date().toISOString(),processes,live,terminalExists:fs.existsSync(p.activeWork.current.completeReleaseRun.evidence+'/TERMINAL.json'),wholeSuitePassing:false};
 const receipt={at:observation.at,checkpoint:c.root+'/checkpoint.json',checkpointSha256:sha(read(c.root+'/checkpoint.json')),documents,stockRun:observation,previewChanged:false,installed:false,laterCoordinationAndRawEvidenceRemotelyBackedUp:false};
 write(c.root+'/COORDINATION.json',receipt);p.activeWork.current.latestCoordination={receipt:c.root+'/COORDINATION.json',sha256:sha(read(c.root+'/COORDINATION.json'))};Object.assign(p.activeWork.current.completeReleaseRun,{live,lastLiveObservation:observation});p.activeWork.updated=receipt.at;
 return{receipt:c.root+'/COORDINATION.json',sha256:sha(read(c.root+'/COORDINATION.json')),pointerBytes:index(p),stockLive:live,stockTerminal:observation.terminalExists};
}
