import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-native-slice-commit',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt);
assert.equal(hash(prep.parentReceipt),prep.parentReceiptSha256);
const paths=['tests/head-pan-interruption.test.ts','tests/head-pane-expansion-labels.test.mjs','tests/native-locate-composed.test.mjs','tests/head-window-drag.test.ts','tests/head-window-drag-interruption.test.ts','tests/slice-wheel.test.mjs','tests/head-slice-viewport.test.ts'];
for(const p of paths){const r=parent.sourceRows.find(r=>r.path===p);assert(r,p);assert.equal(hash(parent.website+'/'+p),r.sha256);if(fs.existsSync(site+'/'+p))assert.equal(hash(site+'/'+p),r.sha256);else fs.copyFileSync(parent.website+'/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);}
// The worker copied the three exact historical fixtures into a real directory.
// Do not replace that directory or write through a parent junction.
assert(fs.statSync(site+'/tests/fixtures').isDirectory());assert(!fs.lstatSync(site+'/tests/fixtures').isSymbolicLink());
const before=stage+'/before/native-slice-commit.worker-original.test.mjs';fs.copyFileSync(site+'/tests/native-slice-commit.test.mjs',before,fs.constants.COPYFILE_EXCL);
// The baseline test's exact original hash is already in worker-baseline/RESULT;
// this post-extension copy is explicitly not called that original preimage.
fs.renameSync(before,stage+'/before/native-slice-commit.main-extended.test.mjs');
fs.writeFileSync(stage+'/CHECK_PREPARATION.json',JSON.stringify({at:new Date().toISOString(),exactCopied:paths.map(p=>({path:p,sha256:hash(site+'/'+p)})),fixtures:'Exact worker-copied historical preimages; no junction',extendedLifecycleTest:{path:site+'/tests/native-slice-commit.test.mjs',sha256:hash(site+'/tests/native-slice-commit.test.mjs')},originalWorkerTestSha256:json(stage+'/worker-baseline/RESULT.json').testSha256},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({exactCopied:paths.length,stage}));
