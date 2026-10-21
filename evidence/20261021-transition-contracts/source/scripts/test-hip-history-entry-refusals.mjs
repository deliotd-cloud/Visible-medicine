// Lightweight entry guards only; never launches the original whole hip test.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseWorktrees,resolveHipHistoryRoot,runOriginalHipQuickCheck,
  authorCommit,authorTree,authorParent,originalScriptSha256} from './hip-quick-check-history-context.mjs';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const runGit=(cwd,args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6});
const listed=parseWorktrees(runGit(root,['worktree','list','--porcelain']));
const author=listed.find(entry=>entry.head===authorCommit&&entry.detached);
assert(author,'An existing detached author checkout is required for entry refusal tests');
const env={...process.env,VM_HIP_HISTORY_ROOT:author.path};
const verified=resolveHipHistoryRoot({env,root,runGit});
assert.equal(verified.commit,authorCommit);
assert.equal(verified.tree,authorTree);
assert.equal(verified.parent,authorParent);
assert.equal(verified.scriptSha256,originalScriptSha256);

const fake=(match,value)=>(cwd,args)=>match(cwd,args)?value:runGit(cwd,args);
const samePath=(left,right)=>process.platform==='win32'
 ?resolve(left).toLowerCase()===resolve(right).toLowerCase():resolve(left)===resolve(right);
const authorCall=(cwd,args)=>samePath(cwd,author.path);
if(process.platform==='win32')assert(samePath(root,root.replaceAll('\\','/').toUpperCase()),'Windows slash/case variants identify the same current root');
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='show'&&args.includes('--format=%T'),'0'.repeat(40))}),/tree changed/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='show'&&args.includes('--format=%P'),'0'.repeat(40))}),/parent changed/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='rev-parse'&&args.some(arg=>arg.endsWith(':public/models/bodyparts3d/full-body/catalog.json')),'0'.repeat(40))}),/catalog Git blob changed/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='status','?? scripts/foreign.mjs')}),/tracked or untracked changes/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='ls-files','scripts/ignored.mjs')}),/contains ignored files/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit:fake((cwd,args)=>authorCall(cwd,args)&&args[0]==='rev-parse'&&args.includes('--git-common-dir'),root)}),/foreign repository/);
assert.throws(()=>resolveHipHistoryRoot({env,root,runGit,readScript:()=>Buffer.from('altered')}),/script bytes changed/);
assert.throws(()=>resolveHipHistoryRoot({env:{...process.env,VM_HIP_HISTORY_ROOT:root},root,runGit}),/current wrapper root/);
const other=listed.find(entry=>entry.head!==authorCommit&&!samePath(entry.path,root)&&entry.detached);
assert(other,'A different existing detached worktree is required for foreign-commit refusal');
assert.throws(()=>resolveHipHistoryRoot({env:{...process.env,VM_HIP_HISTORY_ROOT:other.path},root,runGit}),/foreign commit/);
assert.throws(()=>resolveHipHistoryRoot({env:{...process.env,VM_HIP_HISTORY_ROOT:'relative/path'},root,runGit}),/absolute checkout path/);
for(const value of ['--require foreign','--max-old-space-size=4096 --require foreign','--max-old-space-size=0','--max-old-space-size=99999'])
 assert.throws(()=>resolveHipHistoryRoot({env:{...env,NODE_OPTIONS:value},root,runGit}),/bounded --max-old-space-size/);
const sha=value=>createHash('sha256').update(value).digest('hex');
const original=execFileSync('git',['-C',root,'show',authorCommit+':scripts/test-hip-quick-check-history.mjs'],{windowsHide:true});
assert.equal(sha(original),originalScriptSha256);
const originalPrefix=original.toString().split('const {api,catalog} = await contentContext();')[0];
const wrapper=readFileSync(resolve(root,'scripts/test-hip-quick-check-history.mjs'),'utf8');
assert.equal(wrapper.split('// Immutable body/history is checked by the unchanged whole author script.').length,2);
assert.equal(wrapper.split('// Immutable body/history is checked by the unchanged whole author script.')[0],originalPrefix,'Current nine shoulder literals, positive checks and seven malformed-input refusals remain byte exact');
assert.equal(sha(originalPrefix),'424e549f3ff0750c1a119ef993f7f78b91c4211408047fe755e0d01f7311c5d1');

let child;
const status=runOriginalHipQuickCheck({env:{...env,NODE_OPTIONS:'--max-old-space-size=4096',NODE_PATH:'foreign',NODE_TEST_CONTEXT:'foreign'},root,runGit,
  spawn:(command,args,options)=>{child={command,args,options};return {status:17,signal:null};}});
assert.equal(status,17,'The original child exit status must be preserved');
assert.equal(child.command,process.execPath);
assert.deepEqual(child.args,['--max-old-space-size=4096','scripts/test-hip-quick-check-history.mjs']);
assert.equal(resolve(child.options.cwd),resolve(author.path));
assert.equal(child.options.env.NODE_OPTIONS,undefined);
assert.equal(child.options.env.NODE_PATH,undefined);
assert.equal(child.options.env.NODE_TEST_CONTEXT,undefined);
assert.equal(child.options.env.GIT_NO_REPLACE_OBJECTS,'1');
assert.equal(child.options.stdio,'inherit');
assert.throws(()=>runOriginalHipQuickCheck({env,root,runGit,spawn:()=>({error:new Error('synthetic spawn failure')})}),/synthetic spawn failure/);
assert.throws(()=>runOriginalHipQuickCheck({env,root,runGit,spawn:()=>({status:null,signal:'SIGTERM'})}),/terminated by signal/);
assert.throws(()=>runOriginalHipQuickCheck({env,root,runGit,spawn:()=>({status:null,signal:null})}),/did not return an exit code/);
let childReturned=false;
assert.throws(()=>runOriginalHipQuickCheck({env,root,runGit:(cwd,args)=>childReturned&&authorCall(cwd,args)&&args[0]==='status'?' M app/body-content.ts':runGit(cwd,args),spawn:()=>{childReturned=true;return{status:0,signal:null};}}),/tracked or untracked changes/);
assert.throws(()=>parseWorktrees('not-worktree /foreign\nHEAD '+authorCommit),/Malformed/);
assert.throws(()=>parseWorktrees('worktree /foreign\0HEAD '+authorCommit+'\0HEAD '+authorCommit+'\0\0'),/Duplicate/);
assert.deepEqual(parseWorktrees('worktree /case path/line\nbreak\0HEAD '+authorCommit+'\0detached\0\0'),[{path:'/case path/line\nbreak',head:authorCommit,detached:true}]);
console.log(JSON.stringify({verifiedAuthorRoot:true,refusals:20,currentShoulderPrefixByteExact:true,boundedHeapForwarded:true,childExitPreserved:17,postChildSourceRevalidated:true,originalChildLaunched:false}));
