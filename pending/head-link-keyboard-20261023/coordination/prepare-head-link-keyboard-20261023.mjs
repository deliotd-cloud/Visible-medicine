// Isolated, preview-preserving proposal. The full Website remains at its parent receipt.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard',site=stage+'/website';
const file='F:/VisibleMedicine/staging/20261023-ventricular-website/SOURCE_BOUND.json';
assert.equal(hash(file),'8e41a9c68f78bc5d38d855f204b99b6a46ffd0f321d830c49474d239bb7c2e89');
const parent=json(file),state=json('CURRENT_CHECKPOINT.json');
assert.equal(state.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(state.activeWork.current.activeExecutionSessions.length,0);
for(const [root,head] of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[parent.atlas,parent.atlasHead]]){
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
}
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{stdio:'pipe',windowsHide:true});
execFileSync('git',['-C',site,'read-tree','HEAD'],{stdio:'pipe',windowsHide:true});
for(const r of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
 const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});
 fs.copyFileSync(parent.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);
}
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
const paths=['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx',
 'tests/head-comparison-compact-ui.test.mjs','tests/head-learning-picker.test.ts','tests/head-learning-picker-dismiss.test.mjs',
 'tests/head-comparison-revision.test.ts','tests/head-model-access-navigation.test.ts','tests/related-lecture-entrypoints.test.ts',
 'tests/head-ct-facial-navigation-status.test.mjs','tests/head-model-blank-recovery.test.mjs'];
const preimages=paths.map(p=>{
 const target=containedTarget(stage+'/preimages',p+'.raw');fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(site+'/'+p,target,fs.constants.COPYFILE_EXCL);return{path:p,preserved:target,sha256:hash(target)};
});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:site,parentReceipt:file,
 parentReceiptSha256:hash(file),parentWebsite:parent.website,atlas:parent.atlas,atlasHead:parent.atlasHead,
 atlasTree:parent.atlasTree,preimages,sourcePaths:parent.sourcePaths,installed:false,previewChanged:false,
 fullWebsiteIntegrationPending:true,buildPending:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sourcePaths:parent.sourcePaths,preimages:preimages.length,previewChanged:false}));
