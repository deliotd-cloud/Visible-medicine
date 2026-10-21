import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const proposal='F:/VisibleMedicine/staging/20261021-camera-zoom-contract-proposal';
const prep=json(proposal+'/PREPARATION.json');
const from=proposal+'/atlas-guided-camera.test.ts';
const to='F:/VisibleMedicine/staging/20261021-coverage-epoch-proposal/native-check/tests/atlas-guided-camera.test.ts';
assert.equal(sha(read(prep.site+'/'+prep.path)),prep.beforeSha256);
assert.equal(sha(read(from)),prep.sha256);assert(!fs.existsSync(to));
fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),prep.sha256);
fs.writeFileSync(proposal+'/NATIVE_CHECK_INPUT.json',JSON.stringify({at:new Date().toISOString(),from,to,
 sha256:prep.sha256,cwd:prep.site,scope:'All three unchanged original camera cases plus the explicit new negative zoom-argument case; actual candidate source, metadata and saved Git epoch are read, not changed.',
 candidateEdited:false,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({to,candidateEdited:false}));
