// Isolated teaching successor; never install or restart the owner's preview.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const parent='F:/VisibleMedicine/staging/20261023-review-parser-context/atlas';
const head='66ac064579ee23c5739d0907e8378e0e2d57d7bd';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning',atlas=stage+'/atlas';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,stdio:['pipe','pipe','pipe']}).trim();
assert.equal(git(parent,'rev-parse','HEAD'),head);assert.equal(git(parent,'status','--porcelain'),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
execFileSync('git',['clone','--local','-c','core.autocrlf=false',parent,atlas],{stdio:'pipe',windowsHide:true});git(atlas,'checkout','--detach',head);
const files=git(parent,'ls-files','-z').split('\0').filter(Boolean).map(path=>({path,sha256:hash(parent+'/'+path)}));
for(const r of files)assert.equal(hash(atlas+'/'+r.path),r.sha256);assert.equal(git(atlas,'status','--porcelain'),'');
fs.symlinkSync(parent+'/node_modules',atlas+'/node_modules','junction');fs.mkdirSync(stage+'/preimages');
for(const p of ['lib/reasoning-questions.ts','package.json','content/body-renderer-revision.json'])fs.copyFileSync(atlas+'/'+p,stage+'/preimages/'+p.replaceAll('/','_')+'.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),parent,head,tree:git(parent,'rev-parse','HEAD^{tree}'),atlas,files,installed:false,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,atlas,sourcePaths:files.length,previewChanged:false}));
