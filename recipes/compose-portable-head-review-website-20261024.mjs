// Two-stage test-only successor; no build/pass/deployment is inferred from preparation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-portable-head-review-website',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261024-coherent-harness-website/PREPARATION.json';
const parentHash='1cbbdc7afc84674eef4288504865fa08e6e40570c0c39b379c201e4a52ac285b';
const portable='F:/VisibleMedicine/staging/20261024-head-review-portable-main-v2';
const portablePrep=portable+'/PREPARATION.json',portableHash='b51c7ed2d3082fe26aed5bf1aa410eae130a9b979fa6ad23364b18381f54e77b';
const headCheckpoint='F:/VisibleMedicine/recovery/checkpoints/20261024-head-history-route-verified/checkpoint.json';
const headHash='acdd6a2442f79c5f350c30e9e23e0c5fada18418fcc895ffe892b2711e6133ce';
const planRoot=stage+'-patchset',planFile=planRoot+'/PATCHSET.json';
const expectedPlan='ff6dac103858f318ef38aff67a0e1b1c51b62811d2c83f4653a301d9cb2ed6a6';
const save=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024}).trim();
const memory=()=>JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command',
  '$m=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; $d=Get-PSDrive F; [pscustomobject]@{availableMiB=$m.AvailableMBytes;commitPercent=$m.PercentCommittedBytesInUse;freeBytes=$d.Free} | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
const mode=process.argv[2];assert(['plan','snapshot'].includes(mode));const minimum=mode==='plan'?512:2048;
const measured=memory();
if(measured.availableMiB<minimum||measured.commitPercent>90||(mode==='snapshot'&&measured.freeBytes<2*1024**3)){
 console.log(JSON.stringify({admitted:false,mode,measured,minimumMiB:minimum}));process.exit(75);
}
assert.equal(hash(parentFile),parentHash);const parent=json(parentFile),source=parent.website,rows=new Map(parent.sourceRows.map(row=>[row.path,row]));
assert.equal(hash(portablePrep),portableHash);assert.equal(hash(headCheckpoint),headHash);
const pc=json(portablePrep),hc=json(headCheckpoint),pt=json(portable+'/checks/all-attempt-1/TERMINAL.json');
assert.equal(pt.passing,true);assert.equal(pt.counts.pass,45);assert.equal(pt.preparationSha256,portableHash);assert.deepEqual(pt.sourceDrift,[]);
assert.equal(hc.acceptedFocused.imageHistory.pass,187);assert.equal(hc.acceptedFocused.routeRefusals.pass,2);assert.equal(hc.acceptedFocused.hostControls.pass,2);
const index=json('CURRENT_CHECKPOINT.json');assert.equal(index.goal.status,'active');assert.equal(index.goal.requirements,71);assert.equal(index.goal.optionalIdeas,8);assert.equal(index.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
if(mode==='plan'){
 assert(!fs.existsSync(planRoot));fs.mkdirSync(planRoot);
 const entries=[];
 function add(target,from,expected){
  assert(/^tests\/[A-Za-z0-9_./-]+$/.test(target));assert(!target.split('/').includes('..'));assert(!entries.some(row=>row.target===target));
  assert.equal(hash(from),expected.sha256);assert.equal(fs.statSync(from).size,expected.bytes);
  const original=rows.get(target);if(original)assert.equal(hash(source+'/'+target),original.sha256);else assert(!fs.existsSync(source+'/'+target));
  entries.push({target,source:from,bytes:expected.bytes,sha256:expected.sha256,action:original?'replace':'add',parent:original??null});
 }
 const owned=pc.files.filter(row=>row.path.startsWith('tests/fixtures/head-review-before-guided/')||[
  'tests/head-mri-comparison-page.test.ts','tests/head-guided-review-page-history.test.mjs',
  'tests/head-review-historical-source.mjs','tests/head-review-historical-source.test.mjs'].includes(row.path));
 assert.equal(owned.length,22);for(const row of owned)add(row.path,pc.root+'/'+row.path,row);
 add('tests/head-image-history.test.ts',hc.historySource.path,hc.historySource);
 for(const name of ['head-image-document-host.ts','head-image-document-host.test.ts','head-ct-route-gates.test.mjs']){
  const record=hc.records.find(row=>row.path==='accepted/tests/'+name);assert(record);add('tests/'+name,path.dirname(headCheckpoint)+'/'+record.path,record);
 }
 assert.equal(entries.length,26);assert.equal(entries.filter(row=>row.action==='replace').length,4);assert.equal(entries.filter(row=>row.action==='add').length,22);
 const originalPatch=json('F:/VisibleMedicine/staging/20261024-coherent-harness-patchset-v2/PATCHSET.json');
 assert(entries.every(row=>!originalPatch.entries.some(old=>old.target===row.target)),'Explicitly disjoint successor, never last-write-wins');
 save(planFile,{schema:'vm-portable-head-review-successor-patchset/1',at:new Date().toISOString(),parentFile,parentHash,portablePrep,portableHash,headCheckpoint,headHash,
   measured,entries,expectedSourcePaths:6639,productionSourceChanges:[],modelsOrMasksChanged:false,
   proof:'Frozen original14 via both collectors plus current13 and four integrity controls (45 reported tests); image history187, route2, host2 separately bound. No discarded old assertion.',
   built:false,installed:false,previewChanged:false,wholeWebsiteAccepted:false});
 console.log(JSON.stringify({planFile,sha256:hash(planFile),entries:entries.length,expectedSourcePaths:6639}));
}else{
 assert.equal(hash(planFile),expectedPlan);assert(!fs.existsSync(stage),'Create-only complete source snapshot');const plan=json(planFile);
 assert.equal(git('-C','F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(git('-C','F:/VisibleMedicine/atlas','rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.atlasHead);assert.equal(git('-C',parent.atlas,'rev-parse','HEAD^{tree}'),parent.atlasTree);assert.equal(git('-C',parent.atlas,'status','--porcelain'),'');
 for(const row of plan.entries)assert.equal(hash(row.source),row.sha256);
 const final=memory();if(final.availableMiB<2048||final.commitPercent>90||final.freeBytes<2*1024**3){console.log(JSON.stringify({admitted:false,measured:final,minimumMiB:2048}));process.exit(75);}
 fs.mkdirSync(stage);save(stage+'/STARTED.json',{at:new Date().toISOString(),final,parentFile,parentHash,plan:planFile,planSha256:expectedPlan,previewChanged:false});
 try{
  git('clone','--shared','--no-checkout',source,site);git('-C',site,'read-tree','HEAD');
  for(const row of parent.sourceRows){
   assert.equal(hash(source+'/'+row.path),row.sha256);const to=path.resolve(site,row.path);assert(to.startsWith(path.resolve(site)+path.sep));
   fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);
  }
  const preimages=[];
  for(const row of plan.entries){
   const to=site+'/'+row.target;
   if(row.parent){assert.equal(hash(to),row.parent.sha256);const saved=stage+'/preimage/'+row.target+'.raw';fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(to,saved,fs.constants.COPYFILE_EXCL);preimages.push({path:row.target,saved,sha256:hash(saved)});}
   else assert(!fs.existsSync(to));
   fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.source,to,row.action==='add'?fs.constants.COPYFILE_EXCL:0);assert.equal(hash(to),row.sha256);rows.set(row.target,{path:row.target,bytes:row.bytes,sha256:row.sha256});
  }
  fs.symlinkSync(source+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
  fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(source+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
  const historicalFixtures=[];
  for(const row of parent.historicalFixtures){
   assert(row.path&&!row.path.includes('..')&&!path.isAbsolute(row.path));const from=path.dirname(source)+'/before/'+row.path,to=stage+'/before/'+row.path;assert.equal(hash(from),row.sha256);
   fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);historicalFixtures.push({...row,source:from});
  }
  const sourceRows=[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(sourceRows.length,6639);
  for(const row of sourceRows){assert.equal(hash(site+'/'+row.path),row.sha256);assert.equal(fs.statSync(site+'/'+row.path).size,row.bytes);}
  assert.equal(hash(parentFile),parentHash);assert.equal(hash(planFile),expectedPlan);
  assert.equal(json(site+'/atlas-review/integration-inputs.json').sha256,parent.reviewBindingSha256);
  save(stage+'/PREPARATION.json',{schema:'vm-unbuilt-test-successor/2',at:new Date().toISOString(),website:site,parentWebsite:source,parentFile,parentHash,
   atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,sourceRows,sourcePaths:6639,patchset:planFile,patchsetSha256:expectedPlan,preimages,historicalFixtures,
   reviewBindingSha256:parent.reviewBindingSha256,productionAndReviewSourcesUnchanged:true,changedTestPaths:26,
   previousPassingChecksNotRelabelled:true,originalSuitesRunHere:false,strictRun:false,buildRun:false,wholeSuitePassing:false,previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false});
  save(stage+'/TERMINAL.json',{at:new Date().toISOString(),status:'complete-source-snapshot-unbuilt',sourcePaths:6639,changedTestPaths:26,preparationSha256:hash(stage+'/PREPARATION.json'),previewChanged:false,installed:false});
  console.log(JSON.stringify({stage,sourcePaths:6639,preparationSha256:hash(stage+'/PREPARATION.json'),built:false,installed:false}));
 }catch(error){save(stage+'/FAILURE.json',{at:new Date().toISOString(),message:error.message,stack:error.stack,passing:false});throw error;}
}
