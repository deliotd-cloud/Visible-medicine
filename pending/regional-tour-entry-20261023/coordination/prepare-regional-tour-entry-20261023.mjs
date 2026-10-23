// Isolated source successor. No normal preview, installed source or private data changes.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const parent='F:/VisibleMedicine/staging/20261023-upper-cervical-reasoning/atlas',stage='F:/VisibleMedicine/staging/20261023-regional-tour-entry',atlas=stage+'/atlas';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6}).trim();
const head='dab0c8ffa6986a57f8456303d47fa675a37055cf';assert.equal(git(parent,'rev-parse','HEAD'),head);assert.equal(git(parent,'status','--porcelain'),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
execFileSync('git',['clone','--shared','-c','core.autocrlf=false',parent,atlas],{stdio:'pipe',windowsHide:true});git(atlas,'checkout','--detach',head);
const files=git(parent,'ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,sha256:hash(parent+'/'+p)}));for(const r of files)assert.equal(hash(atlas+'/'+r.path),r.sha256);
fs.symlinkSync(parent+'/node_modules',atlas+'/node_modules','junction');
const allowed=['app/body-explorer.tsx','app/whole-body-guided-learning.tsx','integration/head-neck/main.tsx','scripts/test-whole-body-guided-learning.mjs'];
for(const p of allowed){const target=stage+'/preimages/'+p+'.raw';fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(atlas+'/'+p,target,fs.constants.COPYFILE_EXCL);}
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),parent,atlas,head,tree:git(parent,'rev-parse','HEAD^{tree}'),files,allowed,previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,atlas,sourcePaths:files.length,previewChanged:false}));
