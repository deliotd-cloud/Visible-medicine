import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261023-fda-private-delivery',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261023-midfoot-website/SOURCE_BOUND.json',atlasFile='F:/VisibleMedicine/staging/20261023-fda-review-source/SOURCE_BOUND.json';
assert.equal(hash(parentFile),'02293636ab03d8631787b98d1a1c0c2d8593cdf0008f75159bc4e87fba60de16');assert.equal(hash(atlasFile),'e5dfa9ae125faf78800486ae4261d07869781fb5d6379ed52a537abc924645c2');
const parent=json(parentFile),atlas=json(atlasFile),git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,stdio:'pipe'}).trim();
assert(!fs.existsSync(stage));assert.equal(git(atlas.atlas,'rev-parse','HEAD'),atlas.head);assert.equal(git(atlas.atlas,'status','--porcelain'),'');
assert.equal(git('F:/VisibleMedicine/website','rev-parse','HEAD'),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
fs.mkdirSync(stage);execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{windowsHide:true,stdio:'pipe'});git(site,'read-tree','HEAD');
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);const target=containedTarget(site,r.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,target,fs.constants.COPYFILE_EXCL);assert.equal(hash(target),r.sha256);}
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');
const receipt={at:new Date().toISOString(),stage,website:site,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),baseSourceRows:parent.sourceRows,atlas:atlas.atlas,atlasHead:atlas.head,atlasTree:atlas.tree,atlasReceipt:atlasFile,atlasReceiptSha256:hash(atlasFile),purpose:'Protected independent-reference asset transport groundwork; source Review importer/viewer composition remains a required next integration phase.',previewChanged:false,installed:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage,baseSourcePaths:parent.sourceRows.length,atlasHead:atlas.head,previewChanged:false}));
