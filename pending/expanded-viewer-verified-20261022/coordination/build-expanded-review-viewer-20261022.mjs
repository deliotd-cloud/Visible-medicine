import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const website=root+'/website', step=root+'/viewer-build';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path), json=path=>JSON.parse(read(path));
const save=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert(!existsSync(step),'Create-only build attempt; preserve prior attempts');
const admissionPath=root+'/CEREBRAL_ADMISSION.json', admission=json(admissionPath);
for(const row of admission.sourceRows){ const bytes=read(website+'/'+row.path); assert.equal(bytes.length,row.bytes,row.path); assert.equal(sha(bytes),row.sha256,row.path); }
assert.equal(json(website+'/atlas-review/manifest.json').websiteIntegrationSha256,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
const out=resolve(website,'public/atlas-review-viewer');
assert.equal(out.replaceAll('\\','/'),website+'/public/atlas-review-viewer');
assert(!lstatSync(out).isSymbolicLink(),'Build output must not be redirected');
const walk=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  assert(!entry.isSymbolicLink(),'No redirected viewer files');
  const path=prefix+entry.name;
  return entry.isDirectory()?walk(dir+'/'+entry.name,path+'/'):[path];
});
mkdirSync(step);
const oldViewer=json(out+'/manifest.json');
assert.equal(oldViewer.websiteIntegrationSha256,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
const before=walk(out).sort().map(path=>{ const bytes=read(out+'/'+path); const target=step+'/before/'+path; mkdirSync(dirname(target),{recursive:true}); copyFileSync(out+'/'+path,target); assert.equal(sha(read(target)),sha(bytes)); return {path,bytes:bytes.length,sha256:sha(bytes)}; });
save(step+'/BEFORE.json',{at:new Date().toISOString(),website,output:out,sourceReceipt:admissionPath,sourceReceiptSha256:sha(read(admissionPath)),verifiedSourcePaths:admission.sourceRows.length,files:before});
const log=step+'/build.log'; writeFileSync(log,'',{flag:'wx'});
const child=spawn(process.execPath,['scripts/build-clinical-review-viewer.mjs'],{cwd:website,windowsHide:true,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
const {appendFileSync}=await import('node:fs');
for(const stream of [child.stdout,child.stderr])stream.on('data',bytes=>appendFileSync(log,bytes));
save(step+'/STARTED.json',{at:new Date().toISOString(),driverPid:process.pid,childPid:child.pid,command:['node','scripts/build-clinical-review-viewer.mjs'],cwd:website,log});
console.log(JSON.stringify({phase:'review-viewer-building',pid:child.pid,sourcePaths:admission.sourceRows.length,recoveredViewerFiles:before.length,log}));
const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:null,error:String(error)}));child.on('close',(code,signal)=>resolve({code,signal}));});
const terminal={at:new Date().toISOString(),...result,log,logSha256:sha(read(log))};
save(step+'/BUILD_TERMINAL.json',terminal);
if(result.code!==0){console.log(JSON.stringify(terminal));process.exitCode=1;}
else{
  const viewer=json(out+'/manifest.json');
  assert.equal(viewer.sourceCommit,oldViewer.sourceCommit);
  assert.equal(viewer.websiteIntegrationSha256,'4db82d92f6de502a342396d290380253aff46ef754b23e6161672d40c9abce99');
  assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.modelDelivery,oldViewer.modelDelivery);
  assert.equal(viewer.files.length,46);assert.equal(viewer.packages.length,22);
  const sortedPackages=items=>[...items].sort((a,b)=>a.name.localeCompare(b.name));
  assert.deepEqual(sortedPackages(viewer.packages),sortedPackages(oldViewer.packages));
  for(const file of viewer.files)assert.equal(sha(read(out+'/'+file.path)),file.sha256,file.path);
  assert.equal(sha(read(out+'/THIRD_PARTY_NOTICES.txt')),sha(read(step+'/before/THIRD_PARTY_NOTICES.txt')),'No dependency/licensing change');
  const retained=[];
  for(const file of before.filter(row=>/^assets\/.+\.(js|css)$/.test(row.path))){
    const target=out+'/'+file.path;
    if(existsSync(target))assert.equal(sha(read(target)),file.sha256,'Old filename collision: '+file.path);
    else{mkdirSync(dirname(target),{recursive:true});copyFileSync(step+'/before/'+file.path,target);retained.push(file);}
  }
  const after=walk(out).sort().map(path=>{const bytes=read(out+'/'+path);return{path,bytes:bytes.length,sha256:sha(bytes)};});
  const changedSources=admission.sourceRows.filter(row=>!row.path.startsWith('public/atlas-review-viewer/')).filter(row=>sha(read(website+'/'+row.path))!==row.sha256);
  assert.deepEqual(changedSources,[],'Builder changed a source outside the declared viewer output');
  const complete={at:new Date().toISOString(),website,source:viewer.sourceCommit,review:viewer.websiteIntegrationSha256,viewerFiles:viewer.files.length,packages:viewer.packages.length,builtManifestSha256:sha(read(out+'/manifest.json')),retainedCompatibilityFiles:retained.length,retained,after,sourceOutsideOutputUnchanged:true,clinicalApproval:false,ownerPreviewChanged:false,terminal};
  save(step+'/VERIFIED.json',complete);
  console.log(JSON.stringify({phase:'viewer-built-and-verified',source:complete.source,review:complete.review,files:viewer.files.length,packages:viewer.packages.length,compatibility:retained.length,receipt:step+'/VERIFIED.json'}));
}
