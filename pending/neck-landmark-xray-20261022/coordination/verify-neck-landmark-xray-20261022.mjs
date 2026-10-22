// Serial local-only production-source generation and focused verification.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas';
const stage='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate';
const correction=process.argv.length===3&&process.argv[2]==='--wording-correction';
const producer=process.argv.length===3&&process.argv[2]==='--producer-admission';
assert(process.argv.length===2||correction||producer,'Only explicit correction/admission runs are accepted');
if(correction)assert(JSON.parse(fs.readFileSync(stage+'/verification/TERMINAL.json')).allPassed,'Retain completed initial evidence');
if(producer)assert(JSON.parse(fs.readFileSync(stage+'/verification-wording/TERMINAL.json')).allPassed,'Preserve original source evidence');
const out=stage+(producer?'/verification-producer':correction?'/verification-wording':'/verification');
assert(!fs.existsSync(out),'Immutable run evidence; use a distinct correction run');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  producer?'da84654113bdd27dbfabd6879d82740c8407f4db':'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert(fs.existsSync(stage+'/PREPARATION.json'));
fs.mkdirSync(out);
const results=[];
const env={...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};
const commands=[
  ...(producer?[['shoulder-review-generate',['scripts/review-revisions.mjs']]]:[]),
  ['regional-generate',['scripts/regional-teaching-snapshots.mjs']],
  ['display-pins-generate',['scripts/generate-body-review-display-pins.mjs']],
  ['renderer-generate',['scripts/body-renderer-revisions.mjs']],
  ['neck-native',['--test','scripts/test-neck-landmark-xray.mjs']],
  ['gap-tools',['--test','scripts/test-teaching-gap-report.mjs','scripts/test-teaching-gap-cli.mjs']],
  ['regional-freshness',['--import','tsx','--test','scripts/test-body-teaching-loader.mjs','scripts/test-regional-teaching.mjs','scripts/test-regional-teaching-freshness.mjs']],
  ['source-holds',['scripts/validate-current-source-holds.mjs']],
  ['renderer-check',['scripts/body-renderer-revisions.mjs','--check']],
  ...(producer?[['shoulder-review-check',['scripts/review-revisions.mjs','--check']]]:[]),
  ['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']],
];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const [name,args]of commands){
  const stdout=fs.openSync(out+'/'+name+'.stdout.txt','wx'),stderr=fs.openSync(out+'/'+name+'.stderr.txt','wx');
  const started=Date.now();let exitCode=0;
  try{execFileSync(process.execPath,args,{cwd:root,env,windowsHide:true,stdio:['ignore',stdout,stderr],timeout:240000});}
  catch(error){exitCode=Number.isInteger(error.status)?error.status:-1;}
  finally{fs.closeSync(stdout);fs.closeSync(stderr);}
  const row={name,args,exitCode,elapsedMs:Date.now()-started,stdoutSha256:sha(fs.readFileSync(out+'/'+name+'.stdout.txt')),stderrSha256:sha(fs.readFileSync(out+'/'+name+'.stderr.txt'))};
  results.push(row);console.log(JSON.stringify(row));
  if(exitCode!==0)break;
}
const receipt={schemaVersion:1,at:new Date().toISOString(),root,results,allPassed:results.length===commands.length&&results.every(r=>r.exitCode===0),
  previewChanged:false,canonicalChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
if(!receipt.allPassed)process.exitCode=1;
