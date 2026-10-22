// Preserve every original test/assertion; repair only the synthetic hook lifecycle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',atlas=root+'/atlas',out=root+'/specimen-harness-correction';assert(!fs.existsSync(out));fs.mkdirSync(out);
const p='scripts/test-specimen-model-access.mjs',before=read(root+'/before/atlas/'+p),after=read(atlas+'/'+p);
assert.equal(sha(before),'a84328468f69d81ae9f9f81c210435cc0a57130c76cbc937f556b76683649288');
const harness=text=>{const start=text.indexOf('function harness('),end=text.indexOf('\nconst accessCopy=',start);assert(start>=0&&end>start);return {start,end,text:text.slice(start,end)};};
const previous=harness(before.toString()),current=harness(after.toString());
assert.deepEqual(Buffer.from(after.toString().slice(0,current.start)+previous.text+after.toString().slice(current.end)),before,'complete test source outside the hook harness unchanged');
assert.equal([...after.toString().matchAll(/\btest\(/g)].length,[...before.toString().matchAll(/\btest\(/g)].length,'all six original registered test cases remain');
assert(after.toString().includes("h.ready();assert(!h.button('Practise identification').disabled)"),'original failed readiness assertion retained');
assert(after.toString().includes("oldAnswer.onClick();h.render(); // No render needed to revoke stale answer callback."),'original retired callback assertion retained');
const input=json(root+'/producer-verification/INPUTS.json').before;
const delta=input.filter(r=>sha(read(atlas+'/'+r.path))!==r.sha256).map(r=>r.path);assert.deepEqual(delta,[p],'only one test-only post-build input changes');
const result=spawnSync(process.execPath,['--test','--experimental-strip-types','--test-reporter=tap',p],{cwd:atlas,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,maxBuffer:5e6});
fs.writeFileSync(out+'/stdout.log',result.stdout,{flag:'wx'});fs.writeFileSync(out+'/stderr.log',result.stderr,{flag:'wx'});
const counts=Object.fromEntries([...result.stdout.toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],Number(m[2])]));
const receipt={at:new Date().toISOString(),terminal:true,code:result.status,counts,sourcePath:p,beforeSha256:sha(before),afterSha256:sha(after),onlyHarnessChanged:true,completeOriginalAssertionsPreserved:true,
 stdoutSha256:sha(result.stdout),stderrSha256:sha(result.stderr),baselineAndCandidateFailureReceiptsRetained:true,unrelatedKneeProductUnchanged:true,
 productionInputsAndActualPriorTypesBuildUnchanged:true,noNewProductionBuildClaim:true,syntheticHookScopeOnly:true,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
assert.equal(result.status,0);assert.deepEqual(counts,{tests:6,pass:6,fail:0,cancelled:0,skipped:0,todo:0});
