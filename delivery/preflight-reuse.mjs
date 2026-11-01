import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspect,finalSourceEvidence,deliveryPhases} from './plan.mjs';
import {verifyNativeReuse,receiptPath} from './reuse-native.mjs';
import {hash} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-focus-delivery';
const {source,proof}=inspect();assert(proof.finalSourceEvidence.ready);assert(finalSourceEvidence({required:true}).ready);
const reused=verifyNativeReuse(receiptPath,source.native);
const scripts=['plan.mjs','prepare.mjs','assemble.mjs','verify.mjs','run.mjs','focus-import-delivery.test.mjs','plan.test.mjs','reuse-native.mjs','reuse-native.test.mjs','preflight-reuse.mjs'];
for(const file of scripts){const r=spawnSync(process.execPath,['--check',own+'/'+file],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,file+' syntax');assert(!r.error&&!r.signal);}
const r=spawnSync(process.execPath,['--max-old-space-size=128','--test','--test-reporter=tap',own+'/plan.test.mjs',own+'/reuse-native.test.mjs'],{encoding:'utf8',windowsHide:true,maxBuffer:1e6});
fs.writeFileSync(own+'/recipe-reuse-tests-v2.log',(r.stdout??'')+(r.stderr??''),{flag:'wx'});
assert.equal(r.status,0);assert(!r.error&&!r.signal);
const totals=Object.fromEntries([...r.stdout.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(([,name,value])=>[name,Number(value)]));
assert.deepEqual(totals,{tests:9,pass:9,fail:0,cancelled:0,skipped:0,todo:0});
fs.writeFileSync(own+'/PREFLIGHT_REUSE.json',JSON.stringify({...proof,reused,recipeTests:9,recipeLogSha256:hash(own+'/recipe-reuse-tests-v2.log'),priorFailedRecipeLog:own+'/recipe-reuse-tests.log',scripts:scripts.map(file=>({path:file,sha256:hash(own+'/'+file)})),deliveryPhases,buildsRunByThisRecipe:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourcePaths:proof.sourcePaths,reusableRuntimeFiles:reused.files,reusableSourceInputs:reused.sourceInputs,recipeTests:9,buildsRunByThisRecipe:false}));
