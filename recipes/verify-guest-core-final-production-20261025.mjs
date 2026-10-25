import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
import {guarded} from './run-native-build-balanced-guarded-20261025.mjs';
const phase=process.argv[2];assert(['types','build'].includes(phase));
const stage='F:/VisibleMedicine/staging/20261025-head-search-guest-core-final-website',sourceFile=stage+'/SOURCE_CANDIDATE.json',sourceSha='078a315d863ce312d0d3cd28ab4464407ea2a57a9234762cbb5c2c3014400255';
assert.equal(hash(sourceFile),sourceSha);const source=json(sourceFile),site=source.website,dir=stage+'/checks/'+(phase==='types'?'types-full-attempt-1':'build-attempt-1');
function verify(){assert.equal(hash(sourceFile),sourceSha);for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);for(const d of source.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);}
verify();assert.equal(json(stage+'/checks/search-whole-roots-attempt-1/RESULT.json').passing,true);assert(!fs.existsSync(dir));
let checker,heap,expectedTypeSha;
if(phase==='types'){
 checker=stage+'/whole-project-type-checker.mjs';
 const prior='F:/VisibleMedicine/staging/20261025-abdominal-us-website/whole-project-type-checker.mjs';
 fs.copyFileSync(prior,checker,fs.constants.COPYFILE_EXCL);assert.equal(hash(checker),hash(prior));expectedTypeSha=hash(prior);heap=3072;
}else{
 const types=json(stage+'/checks/types-full-attempt-1/RESULT.json');assert(types.passing&&types.typeResult.diagnostics===0);assert(!fs.existsSync(site+'/dist'));
 checker=stage+'/website-stock-build.mjs';
 const prior='F:/VisibleMedicine/staging/20261025-abdominal-us-website/website-stock-build.mjs';
 fs.copyFileSync(prior,checker,fs.constants.COPYFILE_EXCL);assert.equal(hash(checker),hash(prior));heap=1536;
}
const index=json('CURRENT_CHECKPOINT.json');assert.deepEqual(index.activeWork.current.activeExecutionSessions,[]);index.activeWork.current.activeExecutionSessions=[{kind:'head-search-'+phase,driverPid:process.pid,evidence:dir,sourceSha256:sourceSha}];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
try{
 global.gc();
 const run=await guarded({site,dir,command:'--max-old-space-size='+(phase==='types'?3072:256)+' '+checker,heap,aggregate:3584,minimum:5632,extraEnv:{VM_ATLAS_SOURCE_REPO:source.atlas,ATLAS_SOURCE_REPO:source.atlas}});
 verify();let actual=null,typeResult=null,artifacts=null;
 if(phase==='types'&&fs.existsSync(stage+'/TYPE_RESULT.json')){
  actual=json(stage+'/TYPE_RESULT.json');assert(actual.fullProjectTypes&&actual.actualTransitiveGraph&&!actual.scopeExclusionsAdded&&!actual.substitutions);assert(actual.roots.length>2600&&actual.sourceFiles.length>6200);
  for(const r of actual.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
  typeResult={path:stage+'/TYPE_RESULT.json',sha256:hash(stage+'/TYPE_RESULT.json'),roots:actual.roots.length,files:actual.sourceFiles.length,diagnostics:actual.diagnosticCount};
 }
 if(phase==='build'&&run.passing){
  const rows=[];function walk(folder,prefix=''){for(const e of fs.readdirSync(folder,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=prefix+e.name;if(e.isDirectory())walk(folder+'/'+e.name,p+'/');else{assert(e.isFile());rows.push({path:p,bytes:fs.statSync(folder+'/'+e.name).size,sha256:hash(folder+'/'+e.name)});}}}
  walk(site+'/dist');assert(rows.length>1000);fs.writeFileSync(dir+'/BUILD_ARTIFACTS.json',JSON.stringify({at:new Date().toISOString(),root:site+'/dist',source:{path:sourceFile,sha256:sourceSha},files:rows.sort((a,b)=>a.path.localeCompare(b.path)),localOnly:true},null,2)+'\n',{flag:'wx'});artifacts={path:dir+'/BUILD_ARTIFACTS.json',sha256:hash(dir+'/BUILD_ARTIFACTS.json'),files:rows.length};
 }
 const result={at:new Date().toISOString(),source:{path:sourceFile,sha256:sourceSha},phase,run,passing:run.passing&&(phase==='build'||actual?.diagnosticCount===0),typeResult,artifacts,unchangedWholeTypeCheckerSha256:expectedTypeSha??null,actualCompleteConfiguredTypeScope:phase==='types',actualStockNpmBuildAndEveryPrebuildHook:phase==='build',sourceAndDependencyBytesUnchanged:true,ownerPreviewChanged:false,installed:false,publicDeployment:false,clinicalApproval:false,patientSpaceRegistration:false};
 fs.writeFileSync(dir+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),passing:result.passing,typeResult,artifacts}));process.exitCode=result.passing?0:1;
}finally{const now=json('CURRENT_CHECKPOINT.json');now.activeWork.current.activeExecutionSessions=[];fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(now,null,2)+'\n');}
