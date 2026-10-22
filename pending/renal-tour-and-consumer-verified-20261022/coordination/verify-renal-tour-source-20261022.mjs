// Serial Atlas integration after the already-live native website job is terminal.
// Never restarts a job, changes the preview, or edits the installed checkouts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate',atlas=stage+'/atlas';
const correction=process.argv.length===3&&process.argv[2]==='--after-display-binding';
assert(process.argv.length===2||correction,'Only explicit preserved-display correction is supported.');
const terminal=stage+'/native-website-predecessor/TERMINAL.json';
assert(fs.existsSync(terminal),'Wait for the observed147-root website process; never restart it because observation yielded.');
const wider=json(terminal);assert(wider.terminal);assert.equal(wider.sourceReceiptSha256,'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'389bd0ca846a42c7f21055f55904bcf5df81a09f');
const owned=['lib/renal-tour.ts','content/renal-tour-pins.json','scripts/pin-renal-tour.mjs','scripts/test-renal-tour-source.mjs','scripts/test-renal-tour-registration.mjs','lib/regional-tours.ts'];
for(const p of runGit(['-C',atlas,'diff','--name-only']).toString().trim().split('\n').filter(Boolean))assert(owned.includes(p),p);
if(correction){const initial=json(stage+'/verification/TERMINAL.json');assert.equal(initial.code,1);assert.equal(initial.commands.length,3);assert.equal(initial.commands[2].label,'registration');assert.equal(initial.commands[0].code,0);assert.equal(initial.commands[1].code,0);assert(read(stage+'/verification/registration.stderr.log').toString().includes('assert(await now.parseBodyReviewResponse(current,s.id))'));}
const evidence=stage+(correction?'/verification-bound':'/verification');assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const before=runGit(['-C',atlas,'ls-files','-z','--cached','--others','--exclude-standard']).toString().split('\0').filter(Boolean).sort().map(p=>({path:p,bytes:read(atlas+'/'+p).length,sha256:sha(read(atlas+'/'+p))}));
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),before,precedingNativeTerminal:terminal,precedingNativeSha256:sha(read(terminal)),ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
const originalCommands=[['pin',['scripts/pin-renal-tour.mjs','--check']],['source',['scripts/test-renal-tour-source.mjs']],['registration',['scripts/test-renal-tour-registration.mjs']],
 ['tour-player',['scripts/test-regional-tour-player.mjs']],['wholebody',['scripts/test-whole-body-guided-learning.mjs']],['camera',['scripts/test-tour-camera.mjs']],
 ['display-generate',['scripts/generate-body-review-display-pins.mjs']],['renderer-generate',['scripts/body-renderer-revisions.mjs']],['shoulder-generate',['scripts/review-revisions.mjs']],
 ['source-holds',['scripts/validate-current-source-holds.mjs']],['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],
 ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],['website',['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js','run','build']]];
// The real response parser correctly refuses a new tour with old display pins.
// Generate through actual producers before exercising current packet admission;
// retain the first refusal, and reuse only the unchanged passing narrow inputs.
const commands=correction?[...originalCommands.slice(6,9),originalCommands[2],...originalCommands.slice(3,6),...originalCommands.slice(9)]:originalCommands;
if(correction){const initial=json(stage+'/verification/INPUTS.json');for(const r of initial.before)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,'Unchanged source after first refusal: '+r.path);}
let failure=null;const results=[];
try{for(const[label,args]of commands){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:atlas,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.pendingRenalTour={...(p.activeWork.current.pendingRenalTour??{}),at:new Date().toISOString(),stage,label,pid:child.pid,terminal:false,ownerPreviewChanged:false};fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({label,pid:child.pid}));
 const result=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 results.push({label,args,...result,stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))});assert.equal(result.code,0,label);
}}catch(error){failure=String(error);}
const allowedGenerated=['content/body-review-display-pins.json','content/body-renderer-revision.json','content/review-revisions.json'];
const drift=before.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);for(const p of drift)if(!allowedGenerated.includes(p))failure??='Unexpected source drift: '+p;
assert.equal(runGit(['-C',atlas,'diff','--name-only','--','public/models']).toString().trim(),'','No tracked geometry changes.');
const result={at:new Date().toISOString(),terminal:true,code:failure?1:0,failure,atlas,commands:results,generatedSourceChanges:drift,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const p=json('CURRENT_CHECKPOINT.json');Object.assign(p.activeWork.current.pendingRenalTour,{pid:null,terminal:true,code:result.code,result:evidence+'/TERMINAL.json'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify(result));if(failure)process.exitCode=1;
