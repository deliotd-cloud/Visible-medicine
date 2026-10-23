// Read-only native feature audit against the exact complete, uninstalled Website.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';

const evidence='F:/VisibleMedicine/staging/20261023-carpal-regression-audit';
const receipt='F:/VisibleMedicine/staging/20261023-carpal-website/SOURCE_BOUND.json';
const receiptSha256='29e083ec39cf546e30e577f30bc345db0464f6451acb6c1380a3ca96d91f16d5';
assert.equal(hash(receipt),receiptSha256);
const parent=json(receipt),root=parent.website;
assert(!fs.existsSync(evidence),'Never replace an earlier audit');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(evidence);
const roots=[
 'tests/atlas-label-keyboard.test.ts',
 'tests/clinical-review-axillary-branch-xray.test.ts',
 'tests/clinical-review-continuous-guided-playback.test.ts',
 'tests/clinical-review-elbow-us-followup.test.ts',
 'tests/clinical-review-forearm-vascular-xray.test.ts',
 'tests/clinical-review-girdle-muscle-xray.test.ts',
 'tests/clinical-review-hand-arterial-xray.test.ts',
 'tests/clinical-review-lower-limb-connective-xray.test.ts',
];
const sourceDrift=()=>parent.sourceRows.filter(row=>hash(root+'/'+row.path)!==row.sha256).map(row=>row.path);
assert.deepEqual(sourceDrift(),[],'All6332 source inputs still match the complete Website');
const args=['--max-old-space-size=512','--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...roots];
const record={at:new Date().toISOString(),schema:'vm.current-feature-audit/1',receipt,receiptSha256,root,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,sourcePaths:parent.sourceRows.length,roots,args,installed:false,previewChanged:false,wholeSuitePassing:false};
write(evidence+'/PREFLIGHT.json',record);
const out=fs.createWriteStream(evidence+'/stdout.tap',{flags:'wx'}),err=fs.createWriteStream(evidence+'/stderr.log',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:root,windowsHide:true,env:{...process.env,VM_ATLAS_SOURCE_REPO:parent.atlas,NODE_OPTIONS:'--max-old-space-size=512',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(out);child.stderr.pipe(err);
write(evidence+'/STARTED.json',{...record,pid:child.pid,driverPid:process.pid});
const state=live=>{const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.activeExecutionSessions=p.activeWork.current.activeExecutionSessions.filter(row=>row.role!=='carpal-regression-audit');if(live)p.activeWork.current.activeExecutionSessions.push({role:'carpal-regression-audit',pid:child.pid,driverPid:process.pid,evidence,previewChanged:false});const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);};
state(true);console.log(JSON.stringify({evidence,pid:child.pid,driverPid:process.pid,roots:roots.length}));
const result=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:error.message}));child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
const stdout=fs.readFileSync(out.path,'utf8'),counts=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(key=>[key,Number(stdout.match(new RegExp('^# '+key+' (\\d+)','m'))?.[1]??-1)]));
const drift=sourceDrift(),canonicalHeads=Object.fromEntries(['website','atlas'].map(name=>[name,execFileSync('git',['-C','F:/VisibleMedicine/'+name,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim()]));
write(evidence+'/TERMINAL.json',{...record,...result,finishedAt:new Date().toISOString(),counts,sourceDrift:drift,stdoutSha256:hash(out.path),stderrSha256:hash(err.path),canonicalHeads,resourceFailure:/heap out of memory|Reached heap limit/i.test(stdout+fs.readFileSync(err.path,'utf8'))});
state(false);console.log(JSON.stringify({...result,counts,sourceDrift:drift,evidence}));process.exitCode=result.code===0&&drift.length===0?0:1;
