import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/staging/20261021-source190-website/website';
const proposal='F:/VisibleMedicine/staging/20261021-keyboard-epoch-proposal';
const harness='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check';
const stage='F:/VisibleMedicine/staging/20261021-keyboard-epoch-native-proof';
const contracts=[
 ['tests/atlas-keyboard-modules.test.ts','c51ddcb68911a77154846e14459e666b1c2199dc466feda3d4c497b4fbf3275c','898ccdd2e6fbcd6399b67305d2e2285e8f98755d5d1c19ae72a2dfbe78f11b40'],
 ['tests/atlas-label-keyboard.test.ts','17aaee37c397e5660a77842f881a773651c239aa0025be9740feee2d4618c2a5','3c96b803580556775d34863291a0043f233c1e663be93dcc4d65a50230269f19'],
];
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
assert.equal(frozen.length,5107);for(const row of frozen)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
for(const row of binding.inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
for(const [p,before,after] of contracts){
 assert.equal(sha(read(site+'/'+p)),before);assert.equal(sha(read(proposal+'/preimage/'+p.split('/').at(-1))),before);
 assert.equal(sha(read(proposal+'/'+p)),after);assert(!fs.existsSync(harness+'/'+p));
}
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
// Mechanical copies only. Relative test imports use the already retained,
// read-only-junction harness; process.cwd() remains the real frozen website.
for(const [p] of contracts)fs.copyFileSync(proposal+'/'+p,harness+'/'+p,fs.constants.COPYFILE_EXCL);
const result={stage,site,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',harness,contracts:contracts.map(([path,beforeSha256,sha256])=>({path,beforeSha256,sha256})),namedInputs:5107,reviewInputs:binding.inputs.length,candidateChanged:false,scope:'Two lightweight native Node/FS/Git source/export test modules only; no build, database, model payload or broad validator. Not whole-suite acceptance.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
