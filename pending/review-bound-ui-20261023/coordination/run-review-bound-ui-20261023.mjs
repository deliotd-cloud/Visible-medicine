// Create-only, unserved candidate checks. Never starts/stops a preview or reads decisions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='F:/VisibleMedicine/staging/20261023-review-bound-ui-website';
const prep=JSON.parse(fs.readFileSync(root+'/PREPARATION.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const phase=process.argv[2];
const spec={
  'policy-stale':{args:['--max-old-space-size=128','--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs'],expected:1},
  policy:{args:['--max-old-space-size=128','--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs'],expected:0},
  'policy-tests':{args:['--max-old-space-size=128','--experimental-strip-types','--test','tests/atlas-delivery-policy-preflight.test.mjs'],expected:0},
  plexus:{args:['--max-old-space-size=128','scripts/verify-plexus-review.mjs'],expected:0},
  'coverage-stale':{args:['--max-old-space-size=128','--experimental-strip-types','--test','tests/anatomy-coverage-preflight.test.mjs'],expected:1},
  'coverage-tests':{args:['--max-old-space-size=128','--experimental-strip-types','--test','tests/anatomy-coverage-preflight.test.mjs'],expected:0},
  'coverage-source':{args:['--max-old-space-size=128','scripts/check-anatomy-coverage.mjs','--source-root',prep.atlas,'--check'],expected:0},
  bind:{args:['--max-old-space-size=128','scripts/bind-clinical-review.mjs'],expected:0},
  'bind-reconciled':{args:['--max-old-space-size=128','scripts/bind-clinical-review.mjs'],expected:0},
  viewer:{args:['--max-old-space-size=384','scripts/build-clinical-review-viewer.mjs'],expected:0},
  verify:{args:['--max-old-space-size=128','--experimental-strip-types','scripts/verify-clinical-review.mjs'],expected:0},
}[phase];
assert(spec,'Unknown phase');
assert.equal(prep.normalPreviewChanged,false);assert.equal(prep.installed,false);
assert.equal(sha(fs.readFileSync(prep.sourceParent)),prep.sourceParentSha256);
const policy=fs.readFileSync(prep.website+'/'+prep.policy,'utf8');
const before=fs.readFileSync(root+'/atlas-delivery-policy.before.ts.raw','utf8');
assert.equal(sha(Buffer.from(before)),prep.policyBeforeSha256);
if(phase==='policy-stale') assert.equal(policy,before);
else assert.equal(policy,before.replace(prep.priorInventorySha256,prep.inventorySha256));
assert.equal(sha(fs.readFileSync(prep.website+'/lib/atlas-model-inventory.json')),prep.inventorySha256);
if(phase==='bind') {
  assert(!fs.existsSync(prep.website+'/atlas-review/integration-inputs.json'));
  assert.equal(JSON.parse(fs.readFileSync(prep.website+'/atlas-review/manifest.json')).websiteIntegrationSha256,undefined);
}
if(phase==='viewer') assert(!fs.existsSync(prep.website+'/public/atlas-review-viewer'));
const dir=root+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');
const started={at:new Date().toISOString(),phase,command:[process.execPath,...spec.args],cwd:prep.website,expectedExit:spec.expected,normalPreviewChanged:false};
fs.writeFileSync(dir+'/STARTED.json',JSON.stringify(started,null,2)+'\n',{flag:'wx'});
const r=spawnSync(process.execPath,spec.args,{cwd:prep.website,env:{...process.env,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});
fs.closeSync(out);fs.closeSync(err);
const result={...started,finished:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?String(r.error):null,expectedExitObserved:r.status===spec.expected,stdoutSha256:sha(fs.readFileSync(dir+'/stdout.log')),stderrSha256:sha(fs.readFileSync(dir+'/stderr.log'))};
fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(phase==='policy-stale') assert.match(fs.readFileSync(dir+'/stderr.log','utf8'),/Atlas delivery policy is stale for this inventory/);
if(phase==='coverage-stale') assert.match(fs.readFileSync(dir+'/stdout.log','utf8'),/Anatomy coverage is unavailable/);
console.log(JSON.stringify({phase,exit:r.status,expectedExitObserved:result.expectedExitObserved,receipt:dir+'/TERMINAL.json'}));
assert.equal(r.status,spec.expected);
