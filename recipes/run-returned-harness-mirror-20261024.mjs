// A bounded source-bound test mirror, never a website installation or full build.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';

const kind=process.argv[2];assert.ok(['binder','studio'].includes(kind),'explicit bounded profile');
const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const stage='F:/VisibleMedicine/staging/20261024-returned-harness-main-review';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=filename=>fs.readFileSync(filename);
const json=filename=>JSON.parse(read(filename));
const write=(filename,value)=>{fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const measure=()=>JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"$vmMemory=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; [PSCustomObject]@{at=[DateTime]::UtcNow.ToString('o');availableMiB=$vmMemory.AvailableMBytes;committedPercent=$vmMemory.PercentCommittedBytesInUse} | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true,maxBuffer:65536}));
const minimum=kind==='binder'?512:1024;
const admitted=value=>Number.isFinite(value.availableMiB)&&value.availableMiB>=minimum&&Number.isFinite(value.committedPercent)&&value.committedPercent<=90;
const memory=measure(),observation=stage+'/admissions/'+kind+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
write(observation,{kind,memory,minimumMiB:minimum,admitted:admitted(memory),previewChanged:false});
if(!admitted(memory)){console.log(JSON.stringify({admitted:false,observation,memory}));process.exitCode=2;}else{
 const receipt=read(website+'/../SOURCE_BOUND.json');assert.equal(sha(receipt),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
 const rows=new Map(JSON.parse(receipt).sourceRows.map(row=>[row.path,row]));
 const root=stage+'/'+kind+'-runtime',mirror=root+'/source',attempt=root+'/attempt-1';
 assert.ok(!fs.existsSync(root),'one create-only attempt per reviewed source; no automatic reruns');
 const inputs=new Map();
 const add=(relative,from,expected)=>{
  assert.ok(!path.isAbsolute(relative)&&!relative.includes(':')&&!relative.includes('\\')&&relative.split('/').every(part=>part!==''&&part!=='.'&&part!=='..'),'relative source segments, including legal [...asset] routes');
  assert.match(relative,/\.(mjs|ts|tsx|css|json|raw)$/);
  assert.ok(!inputs.has(relative),'unique destination: '+relative);
  const bytes=read(from);assert.equal(sha(bytes),expected.sha256,relative);if(expected.bytes!==undefined)assert.equal(bytes.length,expected.bytes,relative);
  inputs.set(relative,{from,bytes,sha256:sha(bytes)});
 };
 const real=relative=>{const row=rows.get(relative);assert.ok(row,relative);add(relative,website+'/'+relative,row);};
 let tests,expectedTests,dependency=null;
 if(kind==='binder'){
  const proposal='F:/VisibleMedicine/staging/20261024-binder-history-repair',handoff=json(proposal+'/MAIN_FOLLOWUP.json');
  for(const file of handoff.files.filter(row=>row.path.startsWith(proposal+'/candidate/'))){const relative=file.path.slice((proposal+'/candidate/').length);add(relative,file.path,file);}
  const fixture=json(proposal+'/candidate/tests/fixtures/binder-history-20261024.json');
  for(const row of fixture.realCurrentInputRows)real(row.path);
  real('scripts/bind-clinical-review.mjs');real('tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw');
  tests=['tests/atlas-runtime-expansion-binding.test.mjs'];expectedTests=3;
 }else{
  const proposal='F:/VisibleMedicine/staging/20261024-studio-draft-harness-repair',handoff=json(proposal+'/HANDOFF.json');
  for(const [relative,digest]of Object.entries(handoff.candidateFiles))add(relative.slice('candidate/'.length),proposal+'/'+relative,{sha256:digest});
  for(const relative of ['components/StudioForms.tsx','components/StudioCourseEditor.tsx','lib/studio-draft-scope.ts','lib/studio-session-drafts.ts','lib/studio-release-note-recovery.ts','lib/studio-mutation-context.ts','tests/studio-mutation-context-fixture.mjs','package.json'])real(relative);
  const require=createRequire(website+'/package.json'),entry=require.resolve('typescript'),packageFile=require.resolve('typescript/package.json');
  dependency={entry,entrySha256:sha(read(entry)),packageFile,packageSha256:sha(read(packageFile)),version:json(packageFile).version};
  tests=['tests/studio-course-draft-discard.test.mjs','tests/studio-draft-scope.test.mjs'];expectedTests=20;
 }
 const totalBytes=[...inputs.values()].reduce((sum,row)=>sum+row.bytes.length,0);assert.ok(totalBytes<=5*1024*1024,'bounded first-party text mirror only');
 for(const [relative,row]of inputs){const target=mirror+'/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,row.bytes,{flag:'wx'});}
 const fingerprint=()=>[...inputs].map(([relative,row])=>{assert.equal(sha(read(row.from)),row.sha256,'source unchanged: '+relative);assert.equal(sha(read(mirror+'/'+relative)),row.sha256,'mirror unchanged: '+relative);return {path:relative,from:row.from,bytes:row.bytes.length,sha256:row.sha256};});
 const before=fingerprint();write(root+'/SOURCE.json',{kind,receiptSha256:sha(receipt),totalBytes,inputs:before,dependency,scope:'partial test-only mirror; not a complete Website or browser/signed-in acceptance'});
 const launchMemory=measure();write(root+'/LAUNCH_ADMISSION.json',{minimumMiB:minimum,memory:launchMemory,admitted:admitted(launchMemory)});
 if(!admitted(launchMemory)){console.log(JSON.stringify({admitted:false,mirrorPrepared:true,root,memory:launchMemory}));process.exitCode=2;}else{
  fs.mkdirSync(attempt,{recursive:false});const out=fs.openSync(attempt+'/child.tap','wx'),err=fs.openSync(attempt+'/stderr.log','wx');
  const started=new Date().toISOString();let result;
  try{result=spawnSync(process.execPath,['--max-old-space-size='+ (kind==='binder'?64:128),'--test','--test-concurrency=1','--test-reporter=tap',...tests],{cwd:mirror,env:{...process.env,NODE_PATH:website+'/node_modules',STUDIO_TEST_PACKAGE:website+'/package.json'},windowsHide:true,stdio:['ignore',out,err],timeout:60000});}finally{fs.closeSync(out);fs.closeSync(err);}
  const after=fingerprint();assert.deepEqual(after,before);assert.equal(sha(read(website+'/../SOURCE_BOUND.json')),sha(receipt));
  if(dependency){assert.equal(sha(read(dependency.entry)),dependency.entrySha256);assert.equal(sha(read(dependency.packageFile)),dependency.packageSha256);}
  const tap=read(attempt+'/child.tap').toString();
  const count=name=>{const found=tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));return found?Number(found[1]):null;};
  const counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled','todo'].map(name=>[name,count(name)]));
  const passing=result.status===0&&counts.tests===expectedTests&&counts.pass===expectedTests&&['fail','skipped','cancelled','todo'].every(name=>counts[name]===0);
  write(attempt+'/TERMINAL.json',{kind,started,ended:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,sourceDrift:[],mirrorDrift:[],tapSha256:sha(read(attempt+'/child.tap')),stderrSha256:sha(read(attempt+'/stderr.log')),runtime:process.version,scope:kind==='binder'?'three original/current binder cases with simulated filesystem IO and source-bound real inputs':'twenty original synthetic-hook cases with real source-pinned recovery modules; no real account or draft',fullWebsiteAcceptance:false,browserAcceptance:false,previewChanged:false});
  console.log(JSON.stringify({kind,root,counts,passing,exitCode:result.status}));process.exitCode=passing?0:1;
 }
}
