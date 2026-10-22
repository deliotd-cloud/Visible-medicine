import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-nested-tour-library-pause',site=root+'/atlas',out=root+'/main-evidence';
fs.mkdirSync(out,{recursive:true});
const result=json(root+'/worker-evidence/RESULT.json'),workerChecks=[];
for(const check of result.checks.filter(c=>c.log)){
 const actual=sha(read(root+'/worker-evidence/'+check.log));assert.equal(actual,check.sha256.toLowerCase());
 workerChecks.push({...check,sha256:actual});
}
const checks=[];
for(const [name,args,expected]of [
 ['baseline-parent-red',['scripts/test-nested-tour-library-pause.mjs','--baseline'],1],
 ['baseline-eye-child-red',['scripts/test-nested-tour-library-pause.mjs','--baseline-children','--kind=eye'],1],
 ['baseline-ventricular-child-red',['scripts/test-nested-tour-library-pause.mjs','--baseline-children','--kind=ventricles'],1],
 ['baseline-cardiac-child-red',['scripts/test-nested-tour-library-pause.mjs','--baseline-children','--kind=cardiac'],1],
 ['candidate-green',['scripts/test-nested-tour-library-pause.mjs'],0],
 ]){
 const r=spawnSync(process.execPath,args,{cwd:site,encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true,
  env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'}});
 const log=(r.stdout??'')+(r.stderr??''),path=out+'/'+name+'.log';fs.writeFileSync(path,log,{flag:'wx'});
 assert.equal(r.error,undefined);assert.equal(r.status,expected,log);
 if(expected)assert(log.includes('AssertionError'),'Expected actual behavior refusal, not loader failure');
 checks.push({name,args,exitCode:r.status,expectedFailure:!!expected,log:path,sha256:sha(read(path))});
}
const report={at:new Date().toISOString(),workerOriginalReceiptSha256:sha(read(root+'/worker-evidence/RESULT.json')),workerChecks,
 originalWorkerHashesHistorical:true,mainStrengthening:'Unchanged real library with exact baseline children must fail each supported nested kind. New current-source test calls captured stale timer after layout commit but before passive cleanup, then verifies same caption, selection, stopped sweep and explicit resume. Symbol/object/string/null/unsafe invalid requests are inert. Four instances required.',checks,
 sourceAuditDiagnostic:{chunk:'0f4fe9',exitCode:1,reason:'Independent inverse checker originally expected inline numeric validation, but worker added a separate validPauseRequest declaration. Checker now names all three new statements and still restores every pre-existing component byte; no product change was needed for this diagnostic.'},
 bounds:'256MiB Node; GOMAXPROCS2/RAYON1, serial; no broad suite/typecheck/build/browser/preview/runtime acceptance'};
fs.writeFileSync(out+'/RESULT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:out+'/RESULT.json',sha256:sha(read(out+'/RESULT.json')),currentPassed:1,expectedRed:4}));
