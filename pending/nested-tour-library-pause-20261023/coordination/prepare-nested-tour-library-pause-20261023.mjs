import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-nested-tour-library-pause',atlas=root+'/atlas';
const baseline='F:/VisibleMedicine/staging/20261022-atlas-teaching-tour-composition/atlas';
const head='7978478992f54ea68e0f53c3d195c459c7b80068';
assert.equal(runGit(['-C',baseline,'rev-parse','HEAD']).toString().trim(),head);
assert.equal(runGit(['-C',baseline,'status','--porcelain']).toString().trim(),'');
const patterns=['/*','!*.glb','!*.gltf','!*.obj','!*.ply','!*.zip','!*.png','!*.jpg','!*.jpeg','!*.webp','!*.mp4'];
if(process.argv.includes('--finish')){
 assert(fs.existsSync(root+'/PREPARATION_FAILURE.json'));assert(!fs.existsSync(root+'/PREPARATION.json'));
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),head);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),'17cc5a564348832c268dac9b6d713f48b6b7f530');
}else{
 assert(!fs.existsSync(root));fs.mkdirSync(root);
 runGit(['clone','--shared','--no-checkout',baseline,atlas]);runGit(['-C',atlas,'config','core.autocrlf','false']);runGit(['-C',atlas,'config','core.eol','lf']);
 runGit(['-C',atlas,'sparse-checkout','init','--no-cone']);runGit(['-C',atlas,'sparse-checkout','set','--no-cone','--stdin'],Buffer.from(patterns.join('\n')+'\n'));
 runGit(['-C',atlas,'checkout','--detach',head]);
}
fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const paths=['app/whole-body-guided-learning.tsx','app/eye-layers.tsx','app/ventricles.tsx'];
const originals=paths.map(p=>{const bytes=read(atlas+'/'+p);assert.deepEqual(bytes,runGit(['-C',atlas,'show',head+':'+p]));const dest=root+'/preimage/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});return{path:p,sha256:sha(bytes)};});
const p=json('CURRENT_CHECKPOINT.json');assert.equal(p.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
const receipt={at:new Date().toISOString(),atlas,baseline,head,tree:runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),sparsePatterns:patterns,originals,
 scope:'Source/text/metadata-only sparse checkout. Original geometry/images remain unmodified in Git and baseline; this stage lacks model binaries and cannot be used for export/runtime acceptance.',
 installed:false,previewChanged:false,clinicalApproval:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),sourceOnly:true,previewChanged:false}));
