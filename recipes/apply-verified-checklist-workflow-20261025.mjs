import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {guarded} from './run-small-native-task-guarded-20261025.mjs';
const stage='F:/VisibleMedicine/staging/20261025-checklist-child-env-website',sourceFile=stage+'/SOURCE_CANDIDATE.json',sourceSha='90d21dddfcdffbe42dd6265facb532655c73ff93d85c29acdfd1ded76bb8a509',source=json(sourceFile),site='F:/VisibleMedicine/website';
const dir=stage+'/checks/canonical-workflow-attempt-1',base=json('F:/VisibleMedicine/staging/20261025-navigation-history-website/SOURCE_CANDIDATE.json');
const changed=['scripts/refresh-completion-checklist.mjs','tests/completion-checklist-local-import.test.mjs','docs/completion-checklist.json','docs/completion-checklist.md'];
const added=['tests/completion-checklist-installed-contract.test.mjs',...['completion-checklist-local-import.test.mjs.raw','completion-checklist.json.raw','completion-checklist-19.json.raw','completion-checklist-21.json.raw'].map(p=>'tests/fixtures/checklist-v1-role/'+p)];
function verify(){assert.equal(hash(sourceFile),sourceSha);for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);}
if(process.argv[2]==='child'){
  verify();
  const inputs=json(site+'/atlas-review/integration-inputs.json'),bound=new Map(inputs.inputs.map(r=>[r.path,r.sha256]));
  for(const p of [...changed,...added])assert(!bound.has(p),'Workflow change must not alter a protected application/Review input: '+p);
  const expected={
    'scripts/refresh-completion-checklist.mjs':'8a8d09097784389a15e514db3835345591cb29e7a1dbd6036fe491bf6a261a69',
    'tests/completion-checklist-local-import.test.mjs':'a90edb60ae231b20ab3940a011f34b3ca7fbe46b7418219659efa72845819491',
    'docs/completion-checklist.json':json('F:/VisibleMedicine/staging/20261025-checklist-workflow-website/PREPARATION.json').canonicalChecklistBefore.sha256,
    'docs/completion-checklist.md':hash('F:/VisibleMedicine/recovery/checkpoints/20261025-navigation-history-verified-final/COMPLETION_CHECKLIST_VIEW_AFTER.md'),
  };
  for(const p of changed)assert.equal(hash(site+'/'+p),expected[p],p+': preserve any newer canonical work');for(const p of added)assert(!fs.existsSync(site+'/'+p),p+': new path must be unoccupied');
  const oldList=json(site+'/docs/completion-checklist.json'),newList=json(source.website+'/docs/completion-checklist.json');
  assert.equal(oldList.revision,232);assert.equal(newList.revision,233);assert.deepEqual(newList.items,oldList.items);assert.deepEqual(newList.baseline,oldList.baseline);assert.deepEqual(newList.importedAtlasSource,oldList.importedAtlasSource);
  const before=[];
  for(const p of changed){const dest=dir+'/preimages/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(site+'/'+p,dest,fs.constants.COPYFILE_EXCL);before.push({path:p,sha256:hash(dest)});}
  fs.writeFileSync(dir+'/MUTATION_PLAN.json',JSON.stringify({at:new Date().toISOString(),changed,added,before,allPathsUnboundDeveloperWorkflowOnly:true,ownerPreviewRestartOrRefresh:false},null,2)+'\n',{flag:'wx'});
  for(const p of [...changed,...added]){fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(source.website+'/'+p,site+'/'+p);assert.equal(hash(site+'/'+p),hash(source.website+'/'+p));}
  const run=spawnSync(process.execPath,['--max-old-space-size=256','scripts/refresh-completion-checklist.mjs','--check','--verify-evidence'],{cwd:site,windowsHide:true,shell:false,encoding:'utf8',maxBuffer:4e6,env:process.env});
  fs.writeFileSync(dir+'/checklist.stdout.log',run.stdout??'',{flag:'wx'});fs.writeFileSync(dir+'/checklist.stderr.log',run.stderr??'',{flag:'wx'});
  const command={code:run.status,signal:run.signal,error:run.error?String(run.error):null};
  fs.writeFileSync(dir+'/COMMAND_TERMINAL.json',JSON.stringify(command,null,2)+'\n',{flag:'wx'});
  assert.equal(run.error,undefined);assert.equal(run.signal,null);assert.equal(run.status,0);
  const verdict=JSON.parse(run.stdout.trim());assert.equal(verdict.verdict,'pass');assert.equal(verdict.revision,233);assert.equal(verdict.evidenceChecked,true);assert.equal(verdict.items,71);assert.equal(verdict.optional,8);
  for(const [p,sha256] of bound)assert.equal(hash(site+'/'+p),sha256,p+': protected runtime stays exact');verify();
  const result={at:new Date().toISOString(),passing:true,source:{path:sourceFile,sha256:sourceSha},developerWorkflowApplied:true,paths:[...changed,...added].map(p=>({path:p,sha256:hash(site+'/'+p)})),command,verdict,all1721ProtectedApplicationInputsUnchanged:true,all71ItemsAndEightIdeasStatusesAndAcceptanceUnchanged:true,historical190aImportAndAuditBaselineUnchanged:true,actual6d7MixedModuleInstallationAuthenticated:true,new27bProductRuntimeInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false,permissionsChanged:false};
  fs.writeFileSync(dir+'/APPLIED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}else{
  verify();const checks=json(stage+'/checks/whole-roots-attempt-1/RESULT.json');assert(checks.passing);assert.equal(checks.expectedWholeCases,64);
  const evidence=source.website+'/.local/checklist-v1-evidence',children=fs.readdirSync(evidence).map(n=>evidence+'/'+n);assert.equal(children.length,1);
  const child=json(children[0]+'/terminal.json');assert(child.passing);assert.equal(child.counts.tests,19);assert.equal(child.counts.pass,19);assert.equal(child.counts.skipped,0);
  const i=json('CURRENT_CHECKPOINT.json');assert.deepEqual(i.activeWork.current.activeExecutionSessions,[]);assert.equal(i.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
  i.activeWork.current.activeExecutionSessions=[{kind:'developer-checklist-workflow-only',driverPid:process.pid,evidence:dir,sourceSha256:sourceSha}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(i,null,2)+'\n');
  try{global.gc();const run=await guarded({site,dir,command:'--max-old-space-size=256 '+process.argv[1].replaceAll('\\','/')+' child',heap:256,aggregate:1024,minimum:3072});const applied=fs.existsSync(dir+'/APPLIED.json')?json(dir+'/APPLIED.json'):null;const result={at:new Date().toISOString(),passing:run.passing&&applied?.passing===true,run,applied,wholeParentCases:64,originalV1ChildCases:19,all54OriginalBehaviorCasesPreserved:true,newRefusalAndRenderingCases:28,ownerPreviewChanged:false,fullStockSuitePassing:false};fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing:result.passing,wholeParentCases:64,originalV1ChildCases:19}));process.exitCode=result.passing?0:1;}finally{const now=json('CURRENT_CHECKPOINT.json');now.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(now,null,2)+'\n');}
}
