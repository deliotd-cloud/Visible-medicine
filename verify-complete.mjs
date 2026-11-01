import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {inspect,finalSourceEvidence} from './plan.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-hepatic-delivery';
const {proof}=inspect();assert(proof.finalSourceEvidence.ready);assert(finalSourceEvidence({required:true}).ready);
const r=spawnSync(process.execPath,['--max-old-space-size=96','--test','--test-reporter=tap',own+'/plan.test.mjs'],{encoding:'utf8',windowsHide:true,maxBuffer:1e6});
fs.writeFileSync(own+'/tests-complete.log',(r.stdout??'')+(r.stderr??''),{flag:'wx'});assert.equal(r.status,0);assert(!r.error&&!r.signal);
fs.writeFileSync(own+'/PREFLIGHT_COMPLETE.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceVerified:proof.sourcePaths,imported:proof.imported,bound:proof.boundInputs,recipeTests:6,finalSourceChecks:proof.finalSourceEvidence.ready,fullBuildStarted:false}));
