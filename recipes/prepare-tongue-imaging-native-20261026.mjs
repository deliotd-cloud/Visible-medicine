import fs from 'node:fs'; import path from 'node:path'; import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const parentFile='F:/VisibleMedicine/staging/20261026-quick-check-focus-native/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'27154852c2f5a1578a6e896a917bf7fd12c9e11d3c2dc97d261bebd51113ceba');
const parent=json(parentFile),stage='F:/VisibleMedicine/staging/20261026-tongue-imaging-native',atlas=stage+'/atlas';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.head);
assert.equal(git('-C',parent.atlas,'status','--porcelain'),'');
const current=json('CURRENT_CHECKPOINT.json').activeWork.current;
assert.deepEqual(current.activeExecutionSessions,[]);assert.equal(current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
git('clone','--shared','--no-checkout','--',parent.atlas,atlas);
git('-C',atlas,'config','--local','core.autocrlf','false');git('-C',atlas,'read-tree','HEAD');
for(const row of [...parent.sourceRows,...parent.publicRows]){
  const from=parent.atlas+'/'+row.path,to=path.resolve(atlas,row.path);
  assert(to.startsWith(path.resolve(atlas)+path.sep));assert.equal(hash(from),row.sha256,row.path);
  if(fs.existsSync(to)){assert.equal(hash(to),row.sha256);continue;}
  fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(fs.realpathSync.native(parent.atlas+'/node_modules'),atlas+'/node_modules','junction');
assert.equal(git('-C',atlas,'status','--porcelain'),'');
const prep={at:new Date().toISOString(),atlas,parent:{path:parentFile,sha256:hash(parentFile),head:parent.head,tree:parent.tree},websiteParent:{path:'F:/VisibleMedicine/staging/20261026-workbook-history-website/SOURCE_CANDIDATE.json',sha256:'de19377dc8e1a0c18180e3286f9dfae94209d338ead7f6cb1cd8b5575f0d73fa'},proposalPending:true,normalPreviewChanged:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,parentHead:parent.head,verifiedSourceRows:parent.sourceRows.length,verifiedPublicRows:parent.publicRows.length}));
