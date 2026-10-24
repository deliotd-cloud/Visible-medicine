import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCoverageIndex} from './build-anatomy-coverage-index.mjs';

const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const coverageRevision='b79e110d2d28f18993263926ba35aa7a3f478b20';
export const coverageArtifacts=Object.freeze([
 {scope:'root',path:'docs/anatomy-coverage/root.json',sha256:'5d312d49c85fb8fd0a4a7e0ecd0961307e33a09df0292e4edcb992445bacc640'},
 {scope:'nested',path:'docs/anatomy-coverage/nested.json',sha256:'e58d6324a665ea32ba97a230689acc3b4440c18c9d2e555ac70827906762feae'},
 {scope:'independent',path:'docs/anatomy-coverage/independent.json',sha256:'dadfbece8d2f9004e350f02a55d75e6c5b342bb5c565b4089cdcbce22f13688d'},
 {scope:'reference',path:'docs/anatomy-coverage/reference.json',sha256:'639302b67c71932e7e51c34a116cc5f1c3108d0a6f2a3c6c2b98e047b9d278d1'},
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
