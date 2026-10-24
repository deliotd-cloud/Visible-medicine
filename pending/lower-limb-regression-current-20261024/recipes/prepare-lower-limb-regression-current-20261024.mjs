// Source-only test successor. Never modify the installed preview or parent.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current';
const parentFile='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json';
assert.equal(hash(parentFile),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
const p=json(parentFile),site=stage+'/website',atlas=p.atlas;
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(stage));
assert.equal(execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),p.atlasHead);
assert.equal(execFileSync('git',['-C',atlas,'status','--porcelain'],{encoding:'utf8',windowsHide:true}).trim(),'');
fs.mkdirSync(site,{recursive:true});
for(const r of p.sourceRows){
 assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);
 const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});
 fs.copyFileSync(p.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(p.website+'/node_modules',site+'/node_modules','junction');
fs.symlinkSync(atlas,stage+'/atlas','junction');
const names=['tests/lower-limb-display-pin-history.mjs','tests/lower-limb-display-pin-history.test.mjs','tests/clinical-review-lower-limb-connective-xray.test.ts','tests/release-epoch-composition-preservation.test.mjs'];
const preimages=names.map(name=>{const f=site+'/tests/fixtures/lower-limb-b79-preimage/'+path.basename(name)+'.raw';fs.mkdirSync(path.dirname(f),{recursive:true});fs.copyFileSync(site+'/'+name,f,fs.constants.COPYFILE_EXCL);return{path:name,preimage:f.slice(site.length+1),sha256:hash(f)};});
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
write(stage+'/PREPARATION.json',{at:new Date().toISOString(),parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),website:site,atlas,atlasHead:p.atlasHead,atlasTree:p.atlasTree,sourcePaths:p.sourcePaths,preimages,testOnly:true,previewChanged:false,installed:false});
console.log(JSON.stringify({stage,sourcePaths:p.sourcePaths,preimages:preimages.length,previewChanged:false}));
