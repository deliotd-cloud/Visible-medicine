import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const parentFile='F:/VisibleMedicine/staging/20261026-tongue-imaging-native/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'a3d4688d49f2cce6eb16c0418d46c776c51d386e315a3933d1b69ad4a13e3e38');
const parent=json(parentFile),stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native',atlas=stage+'/atlas';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const current=json('CURRENT_CHECKPOINT.json').activeWork.current;
assert.deepEqual(current.activeExecutionSessions,[]);
assert.equal(current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(git('-C',parent.atlas,'rev-parse','HEAD'),parent.head);
assert.equal(git('-C',parent.atlas,'status','--porcelain'),'');
assert.equal(hash(current.latestVerifiedWebsite.source.path),current.latestVerifiedWebsite.source.sha256);
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
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),atlas,parent:{path:parentFile,sha256:hash(parentFile),head:parent.head,tree:parent.tree},websiteParent:current.latestVerifiedWebsite.source,normalPreviewChanged:false,clinicalApproval:false,proposalPending:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sourcePaths:parent.sourceRows.length,publicPaths:parent.publicRows.length,normalPreviewChanged:false}));
