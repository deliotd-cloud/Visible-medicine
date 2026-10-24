// Serial focused regression execution with complete Website source pre/post seals.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),phase=process.argv[2];
assert(['baseline','current'].includes(phase));
const site=phase==='baseline'?parent.website:prep.website,dir=stage+'/checks/'+phase;
assert(!fs.existsSync(dir));
const stateFile=path.resolve('CURRENT_CHECKPOINT.json'),p=json(stateFile);
assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
const roots=phase==='baseline'?['tests/clinical-review-lower-limb-connective-xray.test.ts']:[
 'tests/clinical-review-lower-limb-connective-xray.test.ts',
 'tests/lower-limb-display-pin-history.test.mjs',
 'tests/lower-limb-pin-history-source-roles.test.mjs',
 'tests/lower-limb-current-source-roles.test.mjs',
 'tests/release-epoch-composition-preservation.test.mjs',
];
const added=phase==='baseline'?[]:[...prep.preimages.map(r=>r.preimage),
 'tests/lower-limb-current-role-inverse.mjs','tests/lower-limb-pin-history-source-roles.test.mjs',
 'tests/lower-limb-current-source-roles.test.mjs'];
const paths=[...parent.sourceRows.map(r=>r.path),...added].sort();
assert.equal(new Set(paths).size,paths.length);
const snapshot=()=>paths.map(file=>({path:file,bytes:fs.statSync(site+'/'+file).size,sha256:hash(site+'/'+file)}));
const before=snapshot();
if(phase==='baseline')assert.deepEqual(new Map(before.map(r=>[r.path,r.sha256])),new Map(parent.sourceRows.map(r=>[r.path,r.sha256])));
const native=()=>{
 const git=(...a)=>execFileSync('git',['-C',prep.atlas,...a],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},stdio:'pipe'}).trim();
 assert.equal(git('rev-parse','HEAD'),prep.atlasHead);assert.equal(git('rev-parse','HEAD^{tree}'),prep.atlasTree);
 assert.equal(git('status','--porcelain'),'');
};native();
fs.mkdirSync(dir,{recursive:true});
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
write(dir+'/SOURCE_BEFORE.json',{site,sourceRows:before,allWebsiteSourcesIncluded:true,nativeHead:prep.atlasHead,nativeTree:prep.atlasTree});
const out=fs.createWriteStream(dir+'/stdout.log',{flags:'wx'}),err=fs.createWriteStream(dir+'/stderr.log',{flags:'wx'});
const args=['--max-old-space-size=1536','--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...roots];
const child=spawn(process.execPath,args,{cwd:site,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:prep.atlas,GIT_NO_REPLACE_OBJECTS:'1',NODE_OPTIONS:'--max-old-space-size=1536',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(out);child.stderr.pipe(err);
const start={at:new Date().toISOString(),phase,cwd:site,node:process.execPath,nodeVersion:process.version,args,pid:child.pid,driverPid:process.pid,heapMiB:1536,previewChanged:false};
write(dir+'/STARTED.json',start);
function state(active){const cp=json(stateFile);cp.activeWork.current.activeExecutionSessions=cp.activeWork.current.activeExecutionSessions.filter(r=>r.role!=='lower-limb-regression-current');if(active)cp.activeWork.current.activeExecutionSessions.push({role:'lower-limb-regression-current',phase,pid:child.pid,driverPid:process.pid,evidence:dir,previewChanged:false});const text=JSON.stringify(cp,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync(stateFile,text);}
state(true);console.log(JSON.stringify({phase,pid:child.pid,roots:roots.length}));
const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:error.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
const text=fs.readFileSync(out.path,'utf8'),counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled'].map(k=>[k,Number(text.match(new RegExp('^# '+k+' (\\d+)$','m'))?.[1]??-1)]));
let integrity={};try{assert.deepEqual(snapshot(),before,'Every Website source, helper and fixture stays exact during this run');native();integrity={sourceUnchanged:true,nativeUnchanged:true};}catch(e){integrity={sourceUnchanged:false,error:e.message};}
write(dir+'/TERMINAL.json',{...start,...result,counts,...integrity,finishedAt:new Date().toISOString(),sourceBeforeSha256:hash(dir+'/SOURCE_BEFORE.json'),stdoutSha256:hash(out.path),stderrSha256:hash(err.path),resourceFailure:/heap out of memory|Reached heap limit/i.test(fs.readFileSync(err.path,'utf8')),privateStudyOrRecordsUsed:false});state(false);
console.log(JSON.stringify({phase,...result,counts,...integrity}));
process.exitCode=result.code===0&&integrity.sourceUnchanged?0:1;
