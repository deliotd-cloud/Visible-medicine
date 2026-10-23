import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCoverageIndex} from './build-anatomy-coverage-index.mjs';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const coverageRevision='9eac0806a7869cfae435010b013ae611d748c0c9';
export const coverageArtifacts=Object.freeze([
 {scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'9efd01b448aa0336966bf80440cd3efeff915264713c2510777b08ba1201f2f8'},
 {scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'15afd64cdd13d6294cb1f08473770ac29c0d4eaa9da70971adfa7d1705298482'},
 {scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'22e3a699c285ae8531a859476d6af47e59bbda71e1506154d920d3a27fe70aae'},
 {scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'b295916f75e7b7b665daea9377e5d5f2a3497d904effc02dc669f94bd6f9d980'},
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
