// Isolated, exact successor; never installs into the owner preview.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash, json} from './seal-simple-website-successor.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261024-head-feature-roles';
const site=stage+'/website';
const file='F:/VisibleMedicine/staging/20261024-head-tools-proof/SOURCE_BOUND.json';
assert.equal(hash(file),'1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0');
const parent=json(file),p=json('CURRENT_CHECKPOINT.json');
assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(p.activeWork.current.activeExecutionSessions.length,0);
assert(!fs.existsSync(stage));
fs.mkdirSync(stage);
execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{windowsHide:true,stdio:'pipe'});
execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true,stdio:'pipe'});
for(const r of parent.sourceRows){
  assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
  const to=containedTarget(site,r.path);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);
  assert.equal(hash(to),r.sha256,r.path);
}
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
const touched=[
 'tests/desktop-learning-row-history.test.mjs',
 'tests/drawable-epoch-current-admission.test.mjs',
 'tests/head-manual-recovery-54-to-55-closed.test.mjs',
 'tests/head-native-history-current-transition.test.mjs',
 'tests/head-tools-wider-consumer-current-role.mjs',
];
fs.mkdirSync(stage+'/preimages');
for(const rel of touched)fs.copyFileSync(site+'/'+rel,stage+'/preimages/'+rel.replaceAll('/','__')+'.raw',fs.constants.COPYFILE_EXCL);
const binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(binding.inputs.filter(r=>touched.includes(r.path)).length,0);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({
 at:new Date().toISOString(),stage,website:site,parentReceipt:file,parentReceiptSha256:hash(file),
 parentWebsite:parent.website,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,
 baseSourceRows:parent.sourceRows,touched,reviewBindingSha256:binding.sha256,
 previewChanged:false,installed:false,
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sourcePaths:parent.sourceRows.length,previewChanged:false}));
