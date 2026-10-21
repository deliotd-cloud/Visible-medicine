// Main-owned mechanical import of the already verified local candidate. No publish.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared';
const prepared=json(root+'/PREPARED.json'),plan=json(prepared.planFile),site=plan.target;
assert.equal(sha(read(root+'/PREPARED.json')),'0bc509a6bea8431416b9526a6ec51f947dc066762763ee1a2c05fd36214ba3cf');
assert.equal(sha(read(prepared.planFile)),prepared.planSha256);assert(!fs.existsSync(root+'/INSTALLATION.json'));
assert.equal(site,'F:/VisibleMedicine/website');assert.equal(fs.realpathSync(site),path.resolve(site));
const gate=json(root+'/OPEN_DRAFT_GATE.json');assert(gate.noActiveReviewEdits&&gate.ownerLocalSwitchPreviouslyAuthorized&&gate.noNotesOrDecisionsChanged);
assert(Date.now()-Date.parse(gate.at)<600000,'Fresh visible open-draft observation required');
assert(json('F:/VisibleMedicine/staging/20261021-buffer-type-application/VERIFICATION.json').passed);
const ps=command=>execFileSync('powershell',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true,maxBuffer:2e6}).trim();
const safe=(base,p)=>{assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));const t=path.resolve(base,p);assert(t.startsWith(path.resolve(base)+path.sep));let cursor=path.resolve(base);for(const part of p.split('/')){cursor=path.join(cursor,part);if(fs.existsSync(cursor))assert(!fs.lstatSync(cursor).isSymbolicLink(),p);}return t;};
const walk=(base,p)=>{const f=safe(base,p),s=fs.lstatSync(f);assert(!s.isSymbolicLink());return s.isDirectory()?fs.readdirSync(f).sort().flatMap(n=>walk(base,p+'/'+n)):[p];};
const copies=json(root+'/COPIES.json');
const checkStagedTrees=()=>{
 for(const g of plan.generated){
  const expected=new Map(g.source.map(r=>[r.path,r]));
  for(const r of prepared.preservedPaths)if(r.path.startsWith(g.scope+'/'))expected.set(r.path,r);
  assert.deepEqual(walk(root,'staged-website/'+g.scope).sort(),[...expected.keys()].map(p=>'staged-website/'+p).sort(),'Staged paths must equal immutable V4 plus preserved LICENSEs: '+g.scope);
  for(const [p,r]of expected){const bytes=read(safe(root,'staged-website/'+p));assert.equal(sha(bytes),r.sha256,p);assert.equal(bytes.length,r.bytes,p);}
 }
 for(const r of plan.operations.filter(r=>!r.scope)){
  assert.equal(sha(read(safe(root,'staged-website/'+r.path))),r.proposedSha256,r.path);
  if(r.canonicalBeforeSha256)assert.equal(sha(read(safe(root,'preimages-website/'+r.path))),r.canonicalBeforeSha256,r.path);
 }
};
const preserved=new Map(prepared.preservedPaths.map(r=>[r.path,r]));
const unchanged=()=>{
 for(const r of plan.rows){const f=safe(site,r.path);if(r.action==='preserve')assert.equal(sha(read(f)),preserved.get(r.path).sha256,r.path);else if(r.canonicalBeforeSha256===null)assert(!fs.existsSync(f),r.path);else assert.equal(sha(read(f)),r.canonicalBeforeSha256,r.path);}
 for(const g of plan.generated){assert.deepEqual(walk(site,g.scope).sort(),g.canonical.map(r=>r.path).sort(),'Exact canonical tree: '+g.scope);for(const r of g.canonical)assert.equal(sha(read(safe(site,r.path))),r.sha256,r.path);}
};
for(const r of copies)assert.equal(sha(read(safe(root,r.path))),r.sha256,r.path);
unchanged();checkStagedTrees();assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),plan.revisions.website);
const atlas='F:/VisibleMedicine/atlas';assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),plan.revisions.atlas);assert.equal(runGit(['-C',atlas,'status','--porcelain=v1']).toString().trim(),'');
runGit(['-C',atlas,'fetch','--no-tags','F:/VisibleMedicine/staging/20261021-atlas-combined-source',plan.revisions.sourceAtlas]);runGit(['-C',atlas,'merge-base','--is-ancestor',plan.revisions.atlas,plan.revisions.sourceAtlas]);
const guarded=['.env.local','.dev.vars','.openai/hosting.json','lib/clinical-review-server.ts','lib/head-atlas-import.ts','.local/plexus-review/assets.ts'].filter(p=>fs.existsSync(safe(site,p))).map(p=>({path:p,sha256:sha(read(safe(site,p)))}));
fs.writeFileSync(root+'/PRIVATE_GUARDS_AT_CUTOVER.json',JSON.stringify(guarded,null,2)+'\n',{flag:'wx'});
const coordination=plan.preservedCoordination.map(r=>({path:r.path,sha256:sha(read(r.path))}));
const processInfo=JSON.parse(ps("Get-CimInstance Win32_Process -Filter 'ProcessId=260328' | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress"));
assert.equal(processInfo.Name,'node.exe');assert.equal(processInfo.CommandLine,'"C:\\Program Files\\nodejs\\node.exe" scripts/start-stable-preview.mjs');assert.equal(processInfo.ParentProcessId,256512);
assert.equal(ps('Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -ExpandProperty OwningProcess'),'260328');
const before={at:new Date().toISOString(),processInfo,reviewBefore:json(site+'/atlas-review/integration-inputs.json').sha256,atlasBefore:plan.revisions.atlas,guarded,coordination,ownerDraftObservation:gate,source:plan.revisions.sourceAtlas,review:plan.revisions.review,publicDeployment:false};
fs.writeFileSync(root+'/BEFORE_INSTALLATION.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
const trees=[],files=[];
try{
 unchanged();checkStagedTrees();
 // Bind both exact observed child identities immediately before stopping.
 ps("$p=Get-CimInstance Win32_Process -Filter 'ProcessId=260328'; if($p.Name -ne 'node.exe' -or $p.ParentProcessId -ne 256512 -or $p.CommandLine -ne '\"C:\\Program Files\\nodejs\\node.exe\" scripts/start-stable-preview.mjs'){throw 'Preview identity drift'}; $children=@(Get-CimInstance Win32_Process -Filter 'ParentProcessId=260328'); if((($children | Sort-Object ProcessId | ForEach-Object {$_.ProcessId}) -join ',') -ne '9356,261032'){throw 'Preview child set drift'}; foreach($child in $children){if($child.ProcessId -eq 9356){if($child.Name -ne 'workerd.exe' -or -not $child.ExecutablePath.StartsWith('F:\\VisibleMedicine\\website\\node_modules\\@cloudflare\\workerd-windows-64\\')){throw 'workerd identity drift'}}elseif($child.ProcessId -ne 261032 -or $child.Name -ne 'conhost.exe'){throw 'conhost identity drift'}}; Stop-Process -Id 260328; Stop-Process -Id 9356 -ErrorAction SilentlyContinue");
 assert.equal(ps('@(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).Count'),'0');
 // Stopped native state stays in local recovery, never in Git/source backup.
 for(const name of ['d1','do']){const from=safe(site,'.wrangler/state/v3/'+name);if(fs.existsSync(from))fs.cpSync(from,root+'/private-state-before/'+name,{recursive:true,errorOnExist:true,force:false,filter:p=>{assert(!fs.lstatSync(p).isSymbolicLink());return true;}});}
 unchanged();checkStagedTrees();
 for(const g of plan.generated){const target=safe(site,g.scope),retained=safe(root,'retained-canonical/'+g.scope),staged=safe(root,'staged-website/'+g.scope);fs.mkdirSync(path.dirname(retained),{recursive:true});fs.renameSync(target,retained);trees.push({scope:g.scope,retained,installed:false});fs.renameSync(staged,target);trees.at(-1).installed=true;}
 for(const r of plan.operations.filter(r=>!r.scope)){const target=safe(site,r.path);fs.mkdirSync(path.dirname(target),{recursive:true});files.push(r);fs.copyFileSync(safe(root,'staged-website/'+r.path),target);assert.equal(sha(read(target)),r.proposedSha256,r.path);}
 for(const r of plan.rows){const expected=r.action==='preserve'?preserved.get(r.path).sha256:r.proposedSha256;assert.equal(sha(read(safe(site,r.path))),expected,r.path);}
 const bound=json(site+'/atlas-review/integration-inputs.json');assert.equal(bound.sha256,plan.revisions.review);assert.equal(bound.inputs.length,1710);for(const r of bound.inputs)assert.equal(sha(read(safe(site,r.path))),r.sha256,r.path);
 for(const r of guarded)assert.equal(sha(read(safe(site,r.path))),r.sha256,r.path);for(const r of coordination)assert.equal(sha(read(r.path)),r.sha256,r.path);
 runGit(['-C',atlas,'-c','core.autocrlf=false','merge','--ff-only',plan.revisions.sourceAtlas]);assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),plan.revisions.sourceAtlas);
 const result={at:new Date().toISOString(),site,atlas,sourceAtlas:plan.revisions.sourceAtlas,review:plan.revisions.review,namedInputs:5155,reviewBindings:1710,ordinaryOperations:files.length,generatedScopes:trees.length,preservedPaths:prepared.preservedPaths.map(r=>r.path),applied:true,previewRestartPending:true,openTabsReloaded:false,privateStateCopiedOnlyLocally:true,databaseMigrationExecuted:false,authAndPrivateCodeUnchanged:true,atlasFastForwardOnly:true,fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
 fs.writeFileSync(root+'/INSTALLATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}catch(error){
 if(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim()===plan.revisions.sourceAtlas){fs.writeFileSync(root+'/POSTINSTALL_ERROR.json',JSON.stringify({at:new Date().toISOString(),error:String(error),websiteAndAtlasRemainAtVerifiedNewSource:true,previewStopped:true},null,2)+'\n',{flag:'wx'});throw error;}
 for(const r of [...files].reverse()){const target=safe(site,r.path),failed=safe(root,'failed-install/'+r.path);fs.mkdirSync(path.dirname(failed),{recursive:true});if(fs.existsSync(target))fs.renameSync(target,failed);if(r.canonicalBeforeSha256)fs.copyFileSync(safe(root,'preimages-website/'+r.path),target);}
 for(const t of [...trees].reverse()){const target=safe(site,t.scope);if(t.installed){const failed=safe(root,'failed-install/'+t.scope);fs.mkdirSync(path.dirname(failed),{recursive:true});fs.renameSync(target,failed);}fs.renameSync(t.retained,target);}
 let oldPreviewLive=true;try{process.kill(260328,0);}catch{oldPreviewLive=false;}
 fs.writeFileSync(root+'/INSTALLATION_FAILED.json',JSON.stringify({at:new Date().toISOString(),error:String(error),websiteSourceRestored:true,previewStopped:!oldPreviewLive,atlasHead:runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),restartIfStopped:{cwd:site,args:['node','scripts/start-stable-preview.mjs']},retryRequiresFreshPreflight:true},null,2)+'\n',{flag:'wx'});throw error;
}
