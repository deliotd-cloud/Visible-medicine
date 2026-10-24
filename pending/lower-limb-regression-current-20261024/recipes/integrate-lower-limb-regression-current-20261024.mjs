// Three explicit consumer role seams and one inverse hook, no product edits.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current',site=stage+'/website';
const prep=json(stage+'/PREPARATION.json'),rows=[];
const consumer='tests/clinical-review-lower-limb-connective-xray.test.ts';
assert.equal(hash(site+'/'+consumer),'dea27b090f230482979e97ec1ff54b5343f8c830885a0e49d09a69e7e5cc2fa6');
let source=fs.readFileSync(site+'/'+consumer,'utf8');
const seams=[
 [' assert.equal(currentPin.runtimeSources.shoulder,priorRevision);'," assert.equal(currentPin.runtimeSources.shoulder,revision,'Current shoulder runtime follows the exact current Atlas source');"],
 [' assert.equal(hash(live.structures),before.shoulderHash);'," assert.equal(hash(epoch.structures),before.shoulderHash,'Historical structure identity remains exact at the connective epoch');"],
 [' assert.equal(hash(live.dissectionProfiles),before.dissectionHash);'," assert.equal(hash(epoch.dissectionProfiles),before.dissectionHash,'Historical dissection profiles remain exact at the connective epoch');"],
];
for(const [before,after]of seams){assert.equal(source.split(before).length,2);source=source.replace(before,after);}
fs.writeFileSync(site+'/'+consumer,source);assert.equal(hash(site+'/'+consumer),'c848b411bd7b92e91e47dbfb0c9c9829131ead5bd64feb5ffe7f78e7f90ea829');
rows.push({path:consumer,seams});
const inverse='tests/lower-limb-current-role-inverse.mjs';
const audited='F:/VisibleMedicine/staging/20261024-adjacent-native-execution/website/'+inverse;
assert.equal(hash(audited),'4eb7bc4c2fdc72944621abee34e0a3d2a9cde642f28c25de697b2819d2569877');
fs.copyFileSync(audited,site+'/'+inverse,fs.constants.COPYFILE_EXCL);
const release='tests/release-epoch-composition-preservation.test.mjs';
source=fs.readFileSync(site+'/'+release,'utf8');
assert.equal(hash(site+'/'+release),prep.preimages.find(r=>r.path===release).sha256);
const releaseSeams=[
 ["import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';", "import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';\nimport {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';"],
 ["assert.equal(sha(bytes),row.after,'Exact reviewed composed source');", "if(row.path==='tests/clinical-review-lower-limb-connective-xray.test.ts')bytes=restoreLowerLimbCurrentRole(bytes);assert.equal(sha(bytes),row.after,'Exact reviewed composed source');"],
];
for(const[before,after]of releaseSeams){assert.equal(source.split(before).length,2);source=source.replace(before,after);}
fs.writeFileSync(site+'/'+release,source);rows.push({path:release,seams:releaseSeams});
fs.writeFileSync(stage+'/MAIN_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),rows,auditedInverse:audited,auditedInverseSha256:hash(audited),productChanged:false,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({consumer:hash(site+'/'+consumer),release:hash(site+'/'+release),previewChanged:false}));
