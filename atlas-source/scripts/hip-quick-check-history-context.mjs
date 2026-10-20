// Offline test entry only. The trusted author checkout contains the original
// whole hip test; this file neither reconstructs nor changes historical data.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

export const authorCommit='6d7ff5c403bdaaf79a10a221a3f72e397d9b9b42';
export const authorTree='213d2736c9f70c506ab64382398849690e01777e';
export const authorParent='2ed773bed8f27257f729b8cf88f98c4c5223a0c9';
export const originalScriptSha256='9a4bb88915f40c80ca77b6b40a665813c7aa56adfe5b419d2f5f88c1a048dcd5';
const currentRoot=dirname(dirname(fileURLToPath(import.meta.url)));
const script='scripts/test-hip-quick-check-history.mjs';
const setup='Provide an existing clean detached same-repository checkout at the exact hip author commit via VM_HIP_HISTORY_ROOT, or register one as a Git worktree. No checkout is created automatically.';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=path=>{const actual=realpathSync(path);return process.platform==='win32'?actual.toLowerCase():actual;};
const within=(path,root)=>{const rel=relative(root,path);return rel===''||rel!=='.'&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../');};
function regular(path,label){
 const info=lstatSync(path);
 assert(info.isFile()&&!info.isSymbolicLink(),`${label} must be a regular file`);
}
function sourceDirectory(path,label){
 const info=lstatSync(path);
 assert(info.isDirectory()&&!info.isSymbolicLink(),`${label} must be a regular directory`);
}
function cleanGitEnvironment(base){
 const env={...base};
 for(const key of Object.keys(env))if(key.toUpperCase().startsWith('GIT_'))delete env[key];
 env.GIT_NO_REPLACE_OBJECTS='1';
 env.GIT_OPTIONAL_LOCKS='0';
 env.GIT_CONFIG_NOSYSTEM='1';
 env.GIT_CONFIG_GLOBAL=process.platform==='win32'?'NUL':'/dev/null';
 return env;
}
function git(cwd,args,runGit){return runGit(cwd,args).trim();}
function historyMemoryArgs(env){
 const values=Object.entries(env).filter(([key,value])=>key.toUpperCase()==='NODE_OPTIONS'&&value).map(([,value])=>value);
 assert(values.length<=1,'Duplicate NODE_OPTIONS values are not allowed');
 if(values.length){
  const match=typeof values[0]==='string'&&/^--max-old-space-size=(\d+)$/.exec(values[0]);
  assert(match&&Number(match[1])>=1024&&Number(match[1])<=8192,'NODE_OPTIONS may contain only a bounded --max-old-space-size setting');
 }
 return [values[0]||'--max-old-space-size=4096'];
}
export function parseWorktrees(porcelain){
 const nul=porcelain.includes('\0');
 return porcelain.split(nul?'\0\0':/\r?\n\r?\n/).filter(block=>block.trim()).map(block=>{
  const lines=block.split(nul?'\0':/\r?\n/).filter(Boolean),first=lines.shift();
  assert(first.startsWith('worktree '),'Malformed Git worktree list');
  const fields=new Map();
  for(const line of lines){const i=line.indexOf(' '),key=i<0?line:line.slice(0,i);assert(!fields.has(key),'Duplicate Git worktree field');fields.set(key,i<0?'':line.slice(i+1));}
  return {path:first.slice(9),head:fields.get('HEAD'),detached:fields.has('detached')};
 });
}
export function resolveHipHistoryRoot({env=process.env,root=currentRoot,runGit,readScript=readFileSync}={}){
 historyMemoryArgs(env);
 const gitEnv=cleanGitEnvironment(env);
 runGit ??= (cwd,args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8',windowsHide:true,env:gitEnv,maxBuffer:4e6});
 const actualRoot=canonical(root);
 const common=canonical(git(root,['rev-parse','--path-format=absolute','--git-common-dir'],runGit));
 const worktrees=parseWorktrees(git(root,['worktree','list','--porcelain','-z'],runGit));
 const requested=env.VM_HIP_HISTORY_ROOT;
 if(requested!==undefined)assert(typeof requested==='string'&&requested.trim()!==''&&isAbsolute(requested),`VM_HIP_HISTORY_ROOT must be an absolute checkout path. ${setup}`);
 const candidates=requested?[requested]:worktrees.filter(entry=>entry.head===authorCommit&&entry.detached).map(entry=>entry.path);
 assert(candidates.length,`No trusted hip author checkout found. ${setup}`);
 let lastError;
 for(const path of candidates){
  try{
   sourceDirectory(path,'Hip author root');
   const trustedRoot=canonical(path);
   assert.notEqual(trustedRoot,actualRoot,'Hip author checkout cannot be the current wrapper root');
   const listed=worktrees.find(entry=>{try{return canonical(entry.path)===trustedRoot;}catch{return false;}});
   assert(listed,'Hip author checkout is not a registered Git worktree');
   assert(listed.detached,'Hip author checkout must be detached');
   assert.equal(listed.head,authorCommit,'Hip author worktree entry has a foreign commit');
   assert.equal(canonical(git(path,['rev-parse','--show-toplevel'],runGit)),trustedRoot,'Hip author checkout root changed');
   assert.equal(canonical(git(path,['rev-parse','--path-format=absolute','--git-common-dir'],runGit)),common,'Hip author checkout belongs to a foreign repository');
   assert.equal(git(path,['rev-parse','HEAD'],runGit),authorCommit,'Hip author commit changed');
   assert.equal(git(path,['show','-s','--format=%T',authorCommit],runGit),authorTree,'Hip author tree changed');
   assert.equal(git(path,['show','-s','--format=%P',authorCommit],runGit),authorParent,'Hip author parent changed');
   assert.equal(git(path,['status','--porcelain=v1','--untracked-files=all'],runGit),'','Hip author checkout has tracked or untracked changes');
   assert.equal(git(path,['ls-files','--others','--ignored','--exclude-standard','--','scripts','app','lib','content','public/models/bodyparts3d/full-body'],runGit),'','Hip author source tree contains ignored files');
   regular(join(path,'.git'),'Hip author worktree pointer');
   sourceDirectory(join(path,'scripts'),'Hip author scripts');
   const original=join(path,script);
   regular(original,'Hip author test script');
   assert(within(canonical(original),trustedRoot),'Hip author script path escapes checkout');
   assert.equal(git(path,['rev-parse',`${authorCommit}:${script}`],runGit),'6b5e608bb6fb7dfd3a56e62056b16c3298a601f5','Hip author script Git blob changed');
   assert.equal(sha256(readScript(original)),originalScriptSha256,'Hip author test script bytes changed');
   regular(join(path,'package.json'),'Hip author package manifest');
   regular(join(path,'package-lock.json'),'Hip author dependency lock');
   const catalog=join(path,'public/models/bodyparts3d/full-body/catalog.json');
   regular(catalog,'Hip author source catalog');
   assert(within(canonical(catalog),trustedRoot),'Hip author catalog path escapes checkout');
   assert.equal(git(path,['rev-parse',`${authorCommit}:public/models/bodyparts3d/full-body/catalog.json`],runGit),'2f4dc97cf918c3cff128dbb55092260430634eaa','Hip author catalog Git blob changed');
   const modules=join(path,'node_modules');
   const modulesStat=lstatSync(modules);
   assert(modulesStat.isDirectory()||modulesStat.isSymbolicLink(),'Hip author node_modules missing');
   const resolvedModules=canonical(modules);
   const trustedModules=worktrees.some(entry=>{
    try{return within(resolvedModules,join(canonical(entry.path),'node_modules'))&&
      canonical(git(entry.path,['rev-parse','--path-format=absolute','--git-common-dir'],runGit))===common;}
    catch{return false;}
   });
   assert(trustedModules,'Hip author dependencies resolve outside registered same-repository worktrees');
   regular(join(modules,'typescript/lib/typescript.js'),'TypeScript dependency');
   regular(join(modules,'esbuild/lib/main.js'),'esbuild dependency');
   return {root:path,commit:authorCommit,tree:authorTree,parent:authorParent,scriptSha256:originalScriptSha256,dependencies:resolvedModules};
  }catch(error){lastError=error;if(requested)break;}
 }
 throw new Error(`No trusted hip author checkout passed verification: ${lastError?.message||'unknown reason'}. ${setup}`);
}
export function runOriginalHipQuickCheck({env=process.env,root=currentRoot,runGit,spawn=spawnSync}={}){
 const verified=resolveHipHistoryRoot({env,root,runGit});
 const childEnv=cleanGitEnvironment(env);
 for(const key of Object.keys(childEnv))if(['NODE_OPTIONS','NODE_PATH','NODE_TEST_CONTEXT'].includes(key.toUpperCase()))delete childEnv[key];
 const result=spawn(process.execPath,[...historyMemoryArgs(env),script],{cwd:verified.root,env:childEnv,stdio:'inherit',windowsHide:true});
 if(result.error)throw result.error;
 assert.equal(result.signal,null,`Original hip test terminated by signal ${result.signal}`);
 assert(Number.isInteger(result.status),'Original hip test did not return an exit code');
 const after=resolveHipHistoryRoot({env,root,runGit});
 assert.equal(canonical(after.root),canonical(verified.root),'Hip author checkout changed during test');
 assert.equal(after.dependencies,verified.dependencies,'Hip author dependency path changed during test');
 return result.status;
}
