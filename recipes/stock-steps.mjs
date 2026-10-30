import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';

const stage='G:/VisibleMedicine-temp/staging/20261030-native-runtime-integration';
const prepFile=stage+'/WEBSITE_PREPARATION.json';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pin=p=>({path:p,sha256:hash(p)});
const prep=json(prepFile),site=prep.website,native=json(prep.native.path),parent=json(prep.parent.path);
assert.equal(prep.schema,'vm-native-website-integration/1');
assert.equal(hash(prep.native.path),prep.native.sha256);
assert.equal(hash(prep.parent.path),'f8cb985cb50ac1d5a8655554774d102f7e613a0a406b1a2dbeaf31b1eabe8400');
assert.equal(prep.atlasHead,native.head);for(const r of prep.ambient)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of prep.parentDependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const phases=['import','inventory','lecture','coverage','review','pin'];
const phase=process.argv[2],position=phases.indexOf(phase);assert(position>=0,'Choose one phase');
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const minimum=phase==='review'?5120:4096;
if(memory.AvailableMBytes<minimum||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,phase,memory,minimum}));process.exit(75);}
const stateFile=stage+'/STOCK_STATE.json',previous=position?json(stateFile):null;
if(position)assert.equal(previous.phase,phases[position-1],'Complete earlier phase first');
const expected=new Map(prep.baseRows.map(r=>[r.path,r.sha256]));
for(const r of prep.initialMutable)expected.set(r.path,r.sha256);
for(const r of previous?.mutable??[])expected.set(r.path,r.sha256);
function verifySource(){
  for(const [p,sha] of expected)assert.equal(hash(site+'/'+p),sha,p);
  for(const r of prep.runtimeRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  for(const r of native.sourceRows)assert.equal(hash(prep.atlas+'/'+r.path),r.sha256,r.path);
  if(position>0){const manifest=json(site+'/atlas-review/manifest.json');assert.equal(manifest.revision,prep.atlasHead);for(const r of manifest.files)assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256,r.path);}
}
verifySource();
const coordination='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2';
assert.equal(path.resolve(process.cwd()).toLowerCase(),path.resolve(coordination).toLowerCase(),'Run from main coordination workspace');
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);
const owner={kind:'native-website-stock',phase,driverPid:process.pid,evidence:stage+'/checks/'+phase+'-attempt-'+(['inventory','review'].includes(phase)?'2':'1'),sourceHead:prep.atlasHead};
index.activeWork.current.activeExecutionSessions=[owner];saveIndex(index);
function clearOwnHandle(){const current=json('CURRENT_CHECKPOINT.json'),handles=current.activeWork.current.activeExecutionSessions;const at=handles.findIndex(row=>row.kind===owner.kind&&row.phase===owner.phase&&row.driverPid===owner.driverPid&&row.evidence===owner.evidence);if(at>=0){handles.splice(at,1);saveIndex(current);}}
process.on('exit',clearOwnHandle);
const output=stage+'/checks/'+phase+'-attempt-'+(['inventory','review'].includes(phase)?'2':'1');assert(!fs.existsSync(output));fs.mkdirSync(output,{recursive:true});
const temp=stage+'/temp';Object.assign(process.env,{TEMP:temp,TMP:temp,TMPDIR:temp,npm_config_cache:temp+'/npm-cache',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'});
function run(name,args,heap=384){
  const result=spawnSync(process.execPath,['--max-old-space-size='+heap,...args],{cwd:site,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:16e6});
  fs.writeFileSync(output+'/'+name+'.stdout.log',result.stdout??'',{flag:'wx'});
  fs.writeFileSync(output+'/'+name+'.stderr.log',(result.stderr??'')+(result.error?.message??''),{flag:'wx'});
  const receipt={name,args,code:result.status,signal:result.signal,stdout:pin(output+'/'+name+'.stdout.log'),stderr:pin(output+'/'+name+'.stderr.log')};
  assert.equal(result.status,0,name+': '+(result.stderr??'').slice(-1400));assert(!result.signal&&!result.error);
  return receipt;
}
function replaceOnce(text,from,to){assert.notEqual(from,to);assert.equal(text.split(from).length,2,from);const next=text.replace(from,to);assert.equal(next.replace(to,from),text);return next;}
const runs=[],changed=[];
function writeKnown(p,bytes){assert(expected.has(p),p);fs.writeFileSync(site+'/'+p,bytes);expected.set(p,hash(site+'/'+p));changed.push(p);}
if(phase==='import'){
  assert(!fs.existsSync(site+'/atlas-review'));
  runs.push(run('import',['scripts/import-clinical-review.mjs',prep.atlas]));
  const manifest=json(site+'/atlas-review/manifest.json'),old=json(parent.website+'/atlas-review/manifest.json');
  assert.equal(manifest.revision,prep.atlasHead);
  const currentPaths=new Set(manifest.files.map(r=>r.path));assert.equal(currentPaths.size,manifest.files.length);for(const r of old.files)assert(currentPaths.has(r.path),'Unexpected removed imported input '+r.path);
  const oldByPath=new Map(old.files.map(r=>[r.path,r]));
  const commitDelta=execFileSync('git',['-C',prep.atlas,'diff','--name-only','-z',parent.atlasHead,prep.atlasHead],{encoding:'utf8',windowsHide:true}).split('\0').filter(Boolean);
  const changedSources=manifest.files.filter(r=>oldByPath.has(r.path)&&oldByPath.get(r.path).sourceSha256!==r.sourceSha256).map(r=>r.path);
  const expectedSources=commitDelta.filter(p=>oldByPath.has(p)).sort();
  assert.deepEqual(changedSources.sort(),expectedSources,'Every changed common import matches the committed source delta');
  fs.writeFileSync(output+'/IMPORT_DELTA.json',JSON.stringify({commonChanged:changedSources,added:manifest.files.filter(r=>!oldByPath.has(r.path)).map(r=>r.path),sourceCommit:prep.atlasHead},null,2)+'\n',{flag:'wx'});
  for(const r of manifest.files){assert.equal(native.sourceRows.find(x=>x.path===r.path)?.sha256,r.sourceSha256,r.path);assert.equal(hash(site+'/atlas-review/'+r.path),r.importedSha256,r.path);}
  assert.equal(hash(site+'/atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'),hash(prep.atlas+'/LICENSES/THIRD_PARTY_NOTICES.md'));
}
if(phase==='inventory'){
  runs.push(run('inventory',['scripts/atlas-model-inventory.mjs']));
  const old=json(stage+'/preimages/lib/atlas-model-inventory.json.raw'),current=json(site+'/lib/atlas-model-inventory.json');
  assert.deepEqual(current.models,old.models);assert.equal(current.purpose,old.purpose);assert.equal(current.learnerDelivery,old.learnerDelivery);
  assert.equal(current.sources.length,4);
  for(const r of current.sources){assert.equal(r.sourceCommit,prep.atlasHead);assert.equal(r.manifestSha256,hash(site+'/public/atlas-runtime/'+r.module+'/manifest.json'));}
  changed.push('lib/atlas-model-inventory.json');expected.set('lib/atlas-model-inventory.json',hash(site+'/lib/atlas-model-inventory.json'));
  const p='lib/atlas-delivery-policy.ts',oldHash=hash(stage+'/preimages/lib/atlas-model-inventory.json.raw'),newHash=hash(site+'/lib/atlas-model-inventory.json');
  writeKnown(p,replaceOnce(fs.readFileSync(site+'/'+p,'utf8'),"manifestRevision: '"+oldHash+"'","manifestRevision: '"+newHash+"'"));
  assert(fs.readFileSync(site+'/'+p,'utf8').includes("audience: 'administrator-review'"));
}
if(phase==='lecture'){
  runs.push(run('lecture',['scripts/lecture-body-catalog.mjs']));
  const old=json(stage+'/preimages/lib/lecture-body-catalog.json.raw'),current=json(site+'/lib/lecture-body-catalog.json');
  assert.equal(current.sourceCommit,prep.atlasHead);
  const {sourceCommit:oldCommit,...oldRest}=old,{sourceCommit:newCommit,...newRest}=current;assert.deepEqual(newRest,oldRest);
  changed.push('lib/lecture-body-catalog.json');expected.set('lib/lecture-body-catalog.json',hash(site+'/lib/lecture-body-catalog.json'));
}
if(phase==='coverage'){
  const coverage=stage+'/coverage-candidate';assert(!fs.existsSync(coverage));
  runs.push(run('coverage',['scripts/generate-anatomy-coverage.mjs','--source-root',prep.atlas,'--revision',prep.atlasHead,'--output-root',coverage]));
  const receipt=json(coverage+'/candidate-manifest.json'),index=json(coverage+'/index.json'),oldIndex=json(stage+'/preimages/docs/anatomy-coverage/index.json.raw');
  assert.equal(receipt.sourceRevision,prep.atlasHead);assert.equal(receipt.sourceArtifacts.length,4);
  assert.equal(receipt.indexSha256,hash(coverage+'/index.json'));
  assert.equal(index.sourceRevision,prep.atlasHead);
  for(const key of ['documentedRootTargetGroups','countingRules','independentWithheldSourceCatalogs'])assert.deepEqual(index[key],oldIndex[key],key);
  const imported=new Map(json(site+'/atlas-review/manifest.json').files.map(r=>[r.path,r]));
  const importedIdentity=Object.keys(index.evidence.sourceInputs).sort().flatMap(p=>{
    const r=imported.get(p);if(!r)return [];
    assert.equal(r.sourceSha256,index.evidence.sourceInputs[p],p);
    return [{path:p,sourceSha256:r.sourceSha256,importedSha256:r.importedSha256}];
  });
  const importedDigest=createHash('sha256').update(JSON.stringify(importedIdentity)).digest('hex');
  const oldView=fs.readFileSync(site+'/lib/anatomy-coverage-view.ts','utf8');
  const oldImported=oldView.match(/coverageImportedRevision='([a-f0-9]{64})'/);assert(oldImported);
  for(const item of receipt.sourceArtifacts){const p='docs/anatomy-coverage/'+item.scope+'.json',now=json(coverage+'/'+item.scope+'.json');assert.equal(hash(coverage+'/'+item.scope+'.json'),item.sha256);assert.equal(now.sourceRevision,prep.atlasHead,item.scope);if(item.scope==='reference')assert.equal(now.evidence.commitReadback.revision,prep.atlasHead,'Reference commit readback follows exact source');writeKnown(p,fs.readFileSync(coverage+'/'+item.scope+'.json'));}
  writeKnown('docs/anatomy-coverage/index.json',fs.readFileSync(coverage+'/index.json'));
  let checker=fs.readFileSync(site+'/scripts/check-anatomy-coverage.mjs','utf8');
  checker=replaceOnce(checker,"coverageRevision='"+parent.atlasHead+"'","coverageRevision='"+prep.atlasHead+"'");
  for(const item of receipt.sourceArtifacts){const p='docs/anatomy-coverage/'+item.scope+'.json',oldHash=hash(stage+'/preimages/'+p+'.raw');checker=replaceOnce(checker,"scope:'"+item.scope+"',path:'"+p+"',sha256:'"+oldHash+"'","scope:'"+item.scope+"',path:'"+p+"',sha256:'"+item.sha256+"'");}
  writeKnown('scripts/check-anatomy-coverage.mjs',checker);
  let view=fs.readFileSync(site+'/lib/anatomy-coverage-view.ts','utf8');
  const snapshotHash=createHash('sha256').update(JSON.stringify(index)).digest('hex');
  const match=view.match(/COVERAGE_SNAPSHOT_REVISION='([a-f0-9]{64})'/);assert(match);
  view=replaceOnce(view,"COVERAGE_SOURCE_REVISION='"+parent.atlasHead+"'","COVERAGE_SOURCE_REVISION='"+prep.atlasHead+"'");
  view=replaceOnce(view,match[0],"COVERAGE_SNAPSHOT_REVISION='"+snapshotHash+"'");
  if(oldImported[1]!==importedDigest)view=replaceOnce(view,oldImported[0],"coverageImportedRevision='"+importedDigest+"'");
  writeKnown('lib/anatomy-coverage-view.ts',view);
  runs.push(run('coverage-check',['scripts/check-anatomy-coverage.mjs','--check','--source-root',prep.atlas]));
  const projection=await import(pathToFileURL(site+'/scripts/verify-anatomy-coverage-view.mjs'));
  assert.equal((await projection.verifyAnatomyCoverageView()).sourceRevision,prep.atlasHead);
}
if(phase==='review'){
  runs.push(run('bind-review',['scripts/bind-clinical-review.mjs']));
  runs.push(run('build-viewer',['scripts/build-clinical-review-viewer.mjs'],1024));
  runs.push(run('verify-review',['scripts/verify-clinical-review.mjs']));
  const manifest=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
  assert.equal(manifest.revision,prep.atlasHead);assert.equal(viewer.sourceCommit,prep.atlasHead);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
  const priorInputs=json(parent.website+'/atlas-review/integration-inputs.json').inputs;
  const priorPaths=new Set(priorInputs.map(r=>r.path)),currentPaths=new Set(inputs.inputs.map(r=>r.path));assert.equal(currentPaths.size,inputs.inputs.length);for(const p of priorPaths)assert(currentPaths.has(p),'Unexpected missing review input '+p);
  const previousImports=new Set(json(parent.website+'/atlas-review/manifest.json').files.map(r=>r.path));
  const addedImports=manifest.files.filter(r=>!previousImports.has(r.path)).map(r=>'atlas-review/'+r.path).sort();
  const footPage='app/workspace/atlas-review/source-comparisons/foot/page.tsx',footPin=parent.sourceRows.find(r=>r.path===footPage);assert(footPin&&!priorPaths.has(footPage));assert.equal(hash(site+'/'+footPage),footPin.sha256,'Foot comparison page remains the exact saved source');
  assert.deepEqual([...currentPaths].filter(p=>!priorPaths.has(p)).sort(),[...addedImports,footPage].sort(),'Seven pinned Atlas additions and the exact previously staged foot review page extend the binding');
  assert.deepEqual(viewer.packages,json(parent.website+'/public/atlas-review-viewer/manifest.json').packages,'Exact dependency names, versions and declarations unchanged');
  for(const r of inputs.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
  for(const r of viewer.files)assert.equal(hash(site+'/public/atlas-review-viewer/'+r.path),r.sha256,r.path);
  const oldNotice=fs.readFileSync(parent.website+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt','utf8');
  const newNotice=fs.readFileSync(site+'/public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt','utf8');
  const oldHeading='Atlas source: '+parent.atlasHead,newHeading='Atlas source: '+prep.atlasHead;
  assert(oldNotice.startsWith('# Clinical Review third-party notices\n\n'+oldHeading+'\n\n'));
  assert(newNotice.startsWith('# Clinical Review third-party notices\n\n'+newHeading+'\n\n'));
  assert.equal(oldNotice.split(oldHeading).length,2);assert.equal(newNotice.split(newHeading).length,2);
  const oldNative=fs.readFileSync(parent.website+'/atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8');
  const newNative=fs.readFileSync(prep.atlas+'/LICENSES/THIRD_PARTY_NOTICES.md','utf8');
  assert.equal(oldNotice.split(oldNative).length,2);assert.equal(newNotice.split(newNative).length,2);
  assert.equal(newNotice,oldNotice.replace(oldHeading,newHeading).replace(oldNative,newNative),'Dependency notice bytes unchanged; only the pinned source heading and native project notices may change');
}
if(phase==='pin'){
  const old=json(stage+'/preimages/tests/fixtures/current-atlas-delivery.json.raw'),manifest=json(site+'/atlas-review/manifest.json'),inputs=json(site+'/atlas-review/integration-inputs.json'),viewer=json(site+'/public/atlas-review-viewer/manifest.json');
  const runtimeSources=Object.fromEntries(Object.keys(old.runtimeSources).map(k=>[k,json(site+'/public/atlas-runtime/'+k+'/manifest.json').sourceCommit]));
  assert(Object.values(runtimeSources).every(v=>v===prep.atlasHead),'All four runtime epochs agree');
  const documents=Object.fromEntries(Object.keys(old.documents).map(p=>[p,hash(site+'/'+p)]));
  const next={...old,source:prep.atlasHead,sourceTree:prep.atlasTree,runtimeSources,reviewIntegration:inputs.sha256,reviewSourceFiles:manifest.files.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,documents};
  assert.deepEqual(Object.keys(next),Object.keys(old));
  writeKnown('tests/fixtures/current-atlas-delivery.json',JSON.stringify(next,null,2)+'\n');
  process.env.VM_ATLAS_SOURCE_REPO=prep.atlas;
  const module=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));
  assert.deepEqual(module.validateCurrentAtlasDelivery(),next);
}
verifySource();
const mutable=[...expected].filter(([p,sha])=>prep.baseRows.find(r=>r.path===p)?.sha256!==sha).map(([p,sha256])=>({path:p,sha256,bytes:fs.statSync(site+'/'+p).size}));
const state={at:new Date().toISOString(),phase,mutable,importedManifest:pin(site+'/atlas-review/manifest.json'),changed,sourceHead:prep.atlasHead,installed:false,ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n');
fs.writeFileSync(output+'/RESULT.json',JSON.stringify({passing:true,phase,runs,state:pin(stateFile),source:pin(prepFile),installed:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,passing:true,result:pin(output+'/RESULT.json'),changed}));
process.off('exit',clearOwnHandle);clearOwnHandle();
