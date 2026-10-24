// Isolated native teaching draft; no preview or canonical checkout changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const parent='F:/VisibleMedicine/staging/20261024-tour-explore-focus/atlas';
const stage='F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning';
const atlas=stage+'/atlas',head='cf9b5091db90219981929f6a9cbfdf1056bac9d6';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:32e6}).trim();
assert.equal(git(parent,'rev-parse','HEAD'),head);
assert.equal(git(parent,'status','--porcelain'),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
git(parent,'clone','--shared','--no-checkout','-c','core.autocrlf=false',parent,atlas);
const alternates=atlas+'/.git/objects/info/alternates',seen=new Set(),ordered=[];
function visit(root){
 const p=path.resolve(root);if(seen.has(p))return;
 assert(seen.size<150);assert(fs.existsSync(p));seen.add(p);
 const a=p+'/info/alternates';
 if(fs.existsSync(a))for(const line of fs.readFileSync(a,'utf8').trim().split(/\r?\n/).filter(Boolean)){
  assert(!line.startsWith('"'));visit(path.isAbsolute(line)?line:path.resolve(p,line));
 }
 ordered.push(p.replaceAll('\\','/'));
}
for(const line of fs.readFileSync(alternates,'utf8').trim().split(/\r?\n/))visit(line);
fs.writeFileSync(alternates,ordered.join('\n')+'\n');git(atlas,'checkout','--detach',head);
const files=git(parent,'ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,bytes:fs.statSync(parent+'/'+p).size,sha256:hash(parent+'/'+p)}));
for(const r of files)assert.equal(hash(atlas+'/'+r.path),r.sha256,r.path);
fs.symlinkSync(parent+'/node_modules',atlas+'/node_modules','junction');
fs.mkdirSync(stage+'/preimages');
for(const p of ['lib/reasoning-questions.ts','package.json'])fs.copyFileSync(parent+'/'+p,stage+'/preimages/'+p.replaceAll('/','_')+'.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),parent,atlas,head,tree:git(parent,'rev-parse','HEAD^{tree}'),files,alternatePostOrder:ordered,previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,atlas,files:files.length,previewChanged:false}));
