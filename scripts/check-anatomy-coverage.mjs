import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCoverageIndex} from './build-anatomy-coverage-index.mjs';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const coverageRevision='544e6c63a3428f6a8b24243fee46f6772037396a';
export const coverageArtifacts=Object.freeze([
 {scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'c30b7e01940da7347e7d09fccbdb9b2643a2f74fbe9a3e3a64ce0853e14a58f6'},
 {scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'0da029bbb4089da1e4679fadba31cbdc7eceac44bdf08f2af5fd2bc217edcfcb'},
 {scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'396a307bcbf3d82d11b631a6031c600eb8a5a48da34a06fbd4a360a1fd7a6717'},
 {scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'317e2082c74e32617888b1cda4d8d650aad6ba2a6c8cd5fa1988573a2e541921'},
]);
const hash=b=>createHash('sha256').update(b).digest('hex');
export function verifyCoverageSources(index,{readSource,committedSource,head,status,expectedRevision=coverageRevision}){
 assert.equal(index.sourceRevision,expectedRevision,'Unexpected inventory source');
 assert.equal(head(),expectedRevision,'Coverage snapshot is stale for this source revision');
 assert.equal(status(),'','Atlas worktree must be clean');
 for(const[path,sha256]of Object.entries(index.evidence.sourceInputs)){
  assert.equal(hash(committedSource(path)),sha256,`${path}: committed source mismatch`);
  assert.equal(hash(readSource(path)),sha256,`${path}: working source mismatch`);
 }
 assert.equal(head(),expectedRevision,'Source revision changed during verification');
 assert.equal(status(),'','Source changed during verification');
 return index;
}
function regular(root,path){
 let target=root;assert(lstatSync(target).isDirectory()&&!lstatSync(target).isSymbolicLink(),'Invalid root');
 for(const part of path.split('/')){target=join(target,part);const stat=lstatSync(target);assert(!stat.isSymbolicLink(),'Symlink source path');}
 assert(lstatSync(target).isFile(),'Nonregular input');return readFileSync(target);
}
export function checkCoverage({sourceRoot,websiteRoot=site,read=regular,git}={}){
 assert(typeof sourceRoot==='string'&&sourceRoot.length>0,'Supply --source-root or VM_ATLAS_SOURCE_REPO');
 const root=resolve(sourceRoot),command=git??((...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 const head=()=>command('rev-parse','HEAD').toString().trim();
 assert.equal(head(),coverageRevision,'Coverage snapshot is stale for this source revision');
 assert.equal(command('status','--porcelain').toString().trim(),'','Atlas worktree must be clean');
 const artifacts=coverageArtifacts.map(a=>({...a,bytes:read(websiteRoot,a.path)})),index=buildCoverageIndex(artifacts);
 return verifyCoverageSources(index,{head,status:()=>command('status','--porcelain').toString().trim(),
  committedSource:path=>command('show',`${coverageRevision}:${path}`),readSource:path=>read(root,path)});
}
export function parseCoverageArgs(args){
 let sourceRoot=process.env.VM_ATLAS_SOURCE_REPO,write=false,seenSource=false,seenMode=false;
 for(let i=0;i<args.length;i++){
  const a=args[i];if(a==='--source-root'&&!seenSource&&args[i+1]&&!args[i+1].startsWith('--')){sourceRoot=args[++i];seenSource=true;}
  else if((a==='--check'||a==='--write')&&!seenMode){write=a==='--write';seenMode=true;}
  else throw new Error('Unknown, repeated or incomplete coverage option: '+a);
 }
 assert(sourceRoot,'Supply --source-root or VM_ATLAS_SOURCE_REPO');return {sourceRoot,write};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {sourceRoot,write}=parseCoverageArgs(process.argv.slice(2)),index=checkCoverage({sourceRoot}),output=join(site,'docs/anatomy-coverage/index.json'),bytes=JSON.stringify(index,null,2)+'\n';
 if(write)writeFileSync(output,bytes,{flag:'wx'});else assert.equal(readFileSync(output,'utf8'),bytes,'Saved coverage index differs; review the scoped evidence before regenerating');
 console.log(JSON.stringify({verdict:'pass',mode:write?'write':'check',sourceRevision:index.sourceRevision,sourceInputs:Object.keys(index.evidence.sourceInputs).length,scopedInventories:index.sourceArtifacts.length,anatomicalCompletenessProven:false,clinicalApproval:false}));
}
