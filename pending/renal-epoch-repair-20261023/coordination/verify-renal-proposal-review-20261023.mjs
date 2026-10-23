import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261023-renal-epoch-repair',p=json(root+'/PREPARATION.json'),worker=json(root+'/worker-evidence/RESULT.json'),red=process.argv.includes('--red');
if(red){assert.equal(sha(read(p.website+'/tests/clinical-review-current-admission.mjs')),worker.changedFilesSha256['tests/clinical-review-current-admission.mjs'],'Historical red setup requires the exact pre-main worker proposal, not current repaired source');for(const [name,digest]of Object.entries(worker.preimageSha256)){const bytes=read(root+'/preimage/'+name);assert.equal(sha(bytes),digest);const out=p.website+'/tests/fixtures/renal-epoch-preimage/'+path.basename(name)+'.raw';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes,{flag:'wx'});}}
const args=['--test','--test-reporter=tap','--test-concurrency=1',...(red?['--test-name-pattern=^mixed learner families','tests/renal-tour-epoch-admission.test.mjs']:['tests/lower-limb-display-pin-history.test.mjs','tests/renal-tour-epoch-admission.test.mjs'])];
const env=nativeAtlasEnvironment({atlas:p.atlas,revision:p.atlasHead,tree:p.atlasTree});Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=256',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'});
const r=spawnSync(process.execPath,args,{cwd:p.website,env,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024}),log=(r.stdout??'')+(r.stderr??''),name=red?'main-mixed-family-red':'main-scoped-green-v2';
fs.writeFileSync(root+'/'+name+'.tap',log,{flag:'wx'});assert.equal(r.error,undefined);assert.equal(r.status,red?1:0,log);
const pass=Number(log.match(/^# pass (\d+)/m)?.[1]),fail=Number(log.match(/^# fail (\d+)/m)?.[1]);assert.equal(fail,red?1:0);assert.equal(pass,red?0:7);
if(red)assert(log.includes('shoulder: exact source in admitted family lib/regional-tours.ts'));
const report={at:new Date().toISOString(),args,exitCode:r.status,pass,fail,expectedCounterexample:red,log:root+'/'+name+'.tap',sha256:sha(read(root+'/'+name+'.tap')),fullOriginalFeatureRootsPending:true,heapMiB:256,previewChanged:false};fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
