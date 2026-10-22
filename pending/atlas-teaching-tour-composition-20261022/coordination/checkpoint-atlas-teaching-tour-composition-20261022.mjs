import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-atlas-teaching-tour-composition';
const stage='F:/VisibleMedicine/staging/20261022-atlas-teaching-tour-composition';
const candidate=stage+'/atlas',epoch='2381efe43b75f8a7fb768a069eecd7268c508dac';
const report=json(stage+'/MAIN_REVIEW.json');
const verify=()=>{for(const row of report.sourceRows)assert.equal(sha(read(candidate+'/'+row.path)),row.sha256,row.path);for(const row of report.localEvidence)assert.equal(sha(read(row.path)),row.sha256,row.path);assert.equal(report.previewChanged,false);assert.equal(report.installed,false);};verify();
if(process.argv.includes('--finalize')){
  const p=json('CURRENT_CHECKPOINT.json'),old=json(root+'/CURRENT_BEFORE.json');
  for(const key of ['goal','safety','historyArchive'])assert.deepEqual(p[key],old[key]);
  assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,old.activeWork.current.ownerPreviewPolicy);
  const documents=[['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']].map(([file,preimage])=>{
    const before=read(root+'/'+preimage),now=read(file),offset=now.indexOf(before);assert(offset>0);assert.equal(offset+before.length,now.length);
    return{file,addedPrefixBytes:offset,priorSha256:sha(before),sha256:sha(now),wholePriorPreserved:true};
  });
  const processSource="@(Get-CimInstance Win32_Process -Filter 'ProcessId=164336 OR ProcessId=136616 OR ProcessId=240252'|Select-Object ProcessId,ParentProcessId,Name,CreationDate)|ConvertTo-Json -Compress";
  const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
  const processes=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',processSource],{encoding:'utf8',windowsHide:true})||'[]');
  const live=processes.length===3&&processes.every(r=>r.Name==='node.exe')&&processes.find(r=>r.ProcessId===136616)?.ParentProcessId===164336&&processes.find(r=>r.ProcessId===240252)?.ParentProcessId===136616;
  const stock={at:new Date().toISOString(),processes,live,terminalExists:fs.existsSync(p.activeWork.current.completeReleaseRun.evidence+'/TERMINAL.json'),wholeSuitePassing:false};
  const receipt={at:stock.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),documents,stockRun:stock,previewChanged:false,laterCoordinationCoveredByRemoteBackup:false};
  fs.writeFileSync(root+'/COORDINATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  p.activeWork.current.latestCoordination={receipt:root+'/COORDINATION.json',sha256:sha(read(root+'/COORDINATION.json'))};
  Object.assign(p.activeWork.current.completeReleaseRun,{live,lastLiveObservation:stock});p.activeWork.updated=stock.at;
  const body=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(body)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',body);
  console.log(JSON.stringify({coordination:root+'/COORDINATION.json',sha256:sha(read(root+'/COORDINATION.json')),stockRunLive:live,stockTerminal:stock.terminalExists,pointerBytes:Buffer.byteLength(body),previewChanged:false}));
}else{
  assert(!fs.existsSync(root));fs.mkdirSync(root);const initial=json('CURRENT_CHECKPOINT.json');assert.equal(initial.goal.status,'active');assert.equal(initial.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
  for(const[from,to]of [['CURRENT_CHECKPOINT.json','CURRENT_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md'],[stage+'/MAIN_REVIEW.json','MAIN_REVIEW.json'],...report.localEvidence.map((row,i)=>[row.path,`evidence/${String(i).padStart(2,'0')}-${path.basename(row.path)}`]),...report.sourceRows.map(row=>[candidate+'/'+row.path,'candidate/'+row.path]),...report.preimages.map(row=>[row.path,'preimage/'+row.key])]){
    fs.mkdirSync(path.dirname(root+'/'+to),{recursive:true});fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);
  }
  assert.equal(runGit(['-C',candidate,'rev-parse','HEAD']).toString().trim(),epoch);
  runGit(['-C',candidate,'add','--',...report.sourceRows.map(row=>row.path)]);
  runGit(['-C',candidate,'-c','user.name=Visible Medicine local checkpoint','-c','user.email=checkpoint@users.noreply.github.com','-c','commit.gpgsign=false','commit','-m','Compose draft hamstring tours, teaching references and committed playback controls']);
  const localHead=runGit(['-C',candidate,'rev-parse','HEAD']).toString().trim(),localTree=runGit(['-C',candidate,'rev-parse','HEAD^{tree}']).toString().trim();
  assert.equal(runGit(['-C',candidate,'status','--porcelain']).toString().trim(),'');verify();
  const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-chunked-runner-verified-source-backup/github-backup.json';
  const parentRepo='F:/VisibleMedicine/history/website-work/github-chunked-runner-verified-20261022.git';
  assert.equal(sha(read(parentPath)),'ca3e9f809664b8695baab441ddf99a3b8adc24889e8ec3803c0bd6a0bc84dcea');
  const parent=json(parentPath);assert(parent.sourceBackupVerified&&parent.strictIntegrity);
  const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
  const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
  const authored=row=>!row.generated&&(/\.(?:ts|tsx|mjs)$/.test(row.path)||row.path==='package.json');
  const additions=[...report.sourceRows.filter(authored).map(row=>['current/'+row.path,candidate+'/'+row.path]),
    ...report.preimages.filter(row=>/\.(?:ts|tsx|mjs)$/.test(row.key)||row.key==='package.json').map(row=>['preimage/'+row.key,row.path]),
    ...['prepare-atlas-teaching-tour-composition-20261022.mjs','verify-atlas-teaching-tour-composition-20261022.mjs','review-atlas-teaching-tour-composition-20261022.mjs','checkpoint-atlas-teaching-tour-composition-20261022.mjs'].map(file=>['coordination/'+file,path.resolve(file)])];
  for(const[name,from]of additions){const key='pending/atlas-teaching-tour-composition-20261022/'+name;assert(!selected.has(key));const copy=root+'/source/'+name;fs.mkdirSync(path.dirname(copy),{recursive:true});fs.copyFileSync(from,copy,fs.constants.COPYFILE_EXCL);selected.set(key,copy);}
  const files=[...selected].map(([name,from])=>({path:name,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
  const verifySource=()=>{verify();for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256);const p=json('CURRENT_CHECKPOINT.json');for(const key of ['goal','safety','historyArchive'])assert.deepEqual(p[key],initial[key]);assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,initial.activeWork.current.ownerPreviewPolicy);assert.equal(sha(read(initial.activeWork.current.sourceReceipt)),initial.activeWork.current.sourceReceiptSha256);assert.equal(runGit(['-C',candidate,'rev-parse','HEAD']).toString().trim(),localHead);};
  const backupRoot=root+'-source-backup';let saved;
  try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-atlas-teaching-tour-composition-20261022.git',branch:'backup/atlas-teaching-tour-composition-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:name=>read(selected.get(name)),verifySource,
    sourceIdentity:{localHead,localTree,baseline:epoch,sourceRows:report.sourceRows.filter(authored)},
    scope:'Inherited filtered source plus authored isolated Atlas composition sources, bounded regressions and source-only preimages. Adds bilateral draft hamstring tours, shoulder/Brain reference wording and commit-bound tour playback controls. Generated pins/teaching/Review/runtime JSON, geometry/models/textures, scans/identifiers/masks, private references/decisions, raw logs/process records and canonical Git ancestry are excluded. No new package/asset or fees. Source-only recovery, not full/private/runnable backup or installed/clinical/spatial/public release acceptance.',
    proof:{focusedNative:report.native,currentComposition:report.currentComposition,generatedBindingScope:report.metadata,reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,previewChanged:false,clinicalApproval:false,spatialRegistration:false,wholeSuitePassing:false,publicDeployment:false}});
  }catch(error){fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify({at:new Date().toISOString(),message:error.message,independentlyVerified:false},null,2)+'\n',{flag:'wx'});}
  verifySource();const receipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
  const sourceBackup={receipt,receiptSha256:sha(read(receipt)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false};
  const checkpoint={at:new Date().toISOString(),milestone:'Coherent isolated Atlas source composition: bilateral hamstring guided learning, cited shoulder teaching and committed playback lifecycle',candidate,localHead,localTree,baseline:epoch,mainReview:stage+'/MAIN_REVIEW.json',mainReviewSha256:sha(read(stage+'/MAIN_REVIEW.json')),nativePassing:report.nativePassing,currentComposition:report.currentComposition,metadata:report.metadata,sourceBackup,sourceRows:report.sourceRows,reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,installed:false,previewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next:'Keep owner preview and selected stock release source/run unchanged. Generate and verify fresh Review/runtime exports and Website import in a new isolated candidate after the heavy lane is free; never transfer prior approvals. Continue full71/eight roadmap and independent safe work.'};
  fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
  const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.pendingAtlasTeachingTourComposition={checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),candidate,localHead,localTree,nativePassing:report.nativePassing,currentComposition:report.currentComposition,reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,installed:false,previewChanged:false,sourceBackup};p.activeWork.updated=checkpoint.at;
  const body=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(body)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',body);
  console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),localHead,localTree,nativePassing:report.nativePassing,sourceBackup,previewChanged:false}));
}
