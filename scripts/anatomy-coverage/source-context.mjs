import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync,existsSync,writeFileSync} from 'node:fs';
import {isAbsolute,resolve,relative,dirname,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {registerHooks} from 'node:module';

export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
/** Legacy source tools use relative reads; call only inside one isolated producer. */
export async function withCoverageWorkingDirectory(sourceRoot,action){
 const previous=process.cwd();process.chdir(sourceRoot);try{return await action();}finally{process.chdir(previous);}
}
const website=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const contains=(root,path)=>{const r=relative(root,path);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r));};
const forbidden=new Set(['.git','.local','node_modules','private','scans','datasets']);
function sourcePath(path){
 assert(typeof path==='string'&&/^[A-Za-z0-9_./-]+$/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'||forbidden.has(p.toLowerCase())||p.toLowerCase().startsWith('.env')),'Unsafe coverage source path');
 assert(/\.(?:ts|js|mjs|json|jsonld|md|txt|html|css)$/.test(path),'Coverage reads text/metadata only');return path;
}
function regular(root,path){
 let target=root;assert(lstatSync(root).isDirectory()&&!lstatSync(root).isSymbolicLink(),'Invalid coverage source root');
 const parts=sourcePath(path).split('/');for(const[p,part]of parts.entries()){target=resolve(target,part);const s=lstatSync(target);assert(!s.isSymbolicLink(),'Linked coverage input');assert(p===parts.length-1?s.isFile():s.isDirectory(),'Nonregular coverage input');}
 assert(lstatSync(target).size<=32*1024*1024,'Oversized coverage metadata');return readFileSync(target);
}
export function parseProducerArgs(argv){
 assert(Array.isArray(argv),'Producer arguments required');const keys={'--source-root':'sourceRoot','--revision':'revision','--output':'output'},args={};
 for(let i=0;i<argv.length;i+=2){const key=keys[argv[i]];assert(key&&!Object.hasOwn(args,key)&&typeof argv[i+1]==='string'&&!argv[i+1].startsWith('--'),'Unknown, duplicate or incomplete producer option');args[key]=argv[i+1];}
 assert(Object.keys(args).length===3&&isAbsolute(args.sourceRoot)&&isAbsolute(args.output),'Absolute source and fresh output paths required');assert.match(args.revision,/^[a-f0-9]{40}$/,'Exact source commit required');assert(args.output.endsWith('.json'),'JSON output required');
 return {...args,sourceRoot:resolve(args.sourceRoot),output:resolve(args.output)};
}
let hookUsed=false;
/** One fresh producer process; no native-module-cache reuse across snapshots. */
export function createCoverageSource(args){
 assert(args&&isAbsolute(args.sourceRoot)&&/^[a-f0-9]{40}$/.test(args.revision),'Exact source context required');
 const root=resolve(args.sourceRoot),rootUrl=pathToFileURL(root+sep).href,inputs=new Map();let hooks=null,closed=false;
 const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:undefined,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(realpathSync(root),realpathSync(git('rev-parse','--show-toplevel').toString().trim()),'Coverage source must be its repository root');
 const assertCurrent=()=>{assert.equal(git('rev-parse','HEAD').toString().trim(),args.revision,'Coverage source HEAD changed');assert.equal(git('status','--porcelain','--untracked-files=all').toString().trim(),'','Coverage source must be clean');};assertCurrent();
 const read=path=>{assert(!closed,'Coverage source is closed');const bytes=regular(root,path),digest=hash(bytes);if(inputs.has(path))assert.equal(inputs.get(path),digest,'Coverage input changed during load: '+path);inputs.set(path,digest);return bytes;};
 // Native TypeScript/ESM interpretation also depends on the source package mode.
 const packageMode=JSON.parse(read('package.json'));assert.equal(packageMode.type,'module','Coverage producers require source ESM mode');
 return {root,rootUrl,revision:args.revision,read,json:path=>JSON.parse(read(path)),
  hook(){
   assert(!closed&&!hooks&&!hookUsed,'Use one fresh coverage producer process');hookUsed=true;
   hooks=registerHooks({resolve(specifier,context,next){
    let result;try{result=next(specifier,context);}catch(error){
     if(error.code!=='ERR_MODULE_NOT_FOUND'||!context.parentURL?.startsWith(rootUrl)||!/^\.\.?\//.test(specifier)||/\.[a-z0-9]+$/i.test(specifier))throw error;
     const candidate=new URL(specifier+'.ts',context.parentURL);assert(candidate.href.startsWith(rootUrl),'Coverage import escaped source');assert(existsSync(fileURLToPath(candidate)),'Missing coverage import');result=next(candidate.href,context);
    }
    if(context.parentURL?.startsWith(rootUrl)&&!result.url.startsWith('node:'))assert(result.url.startsWith(rootUrl),'Coverage import escaped source');return result;
   },load(url,context,next){
    if(url.startsWith(rootUrl)){const parsed=new URL(url);assert(!parsed.search&&!parsed.hash,'Unversioned source module query');const path=relative(root,fileURLToPath(parsed)).replaceAll('\\','/');read(path);}return next(url,context);
   }});
  },
  verify(){
   assert(!closed,'Coverage source is closed');assertCurrent();
   for(const[path,digest]of inputs){assert.equal(hash(regular(root,path)),digest,'Working coverage input changed: '+path);assert.equal(hash(git('show',args.revision+':'+path)),digest,'Coverage input differs from committed blob: '+path);}
   assertCurrent();return Object.fromEntries([...inputs].sort(([a],[b])=>a.localeCompare(b)));
  },
  close(){hooks?.deregister();hooks=null;closed=true;},
 };
}
/** Never replaces canonical website snapshots or any source/private payload. */
export function writeCoverageOutput(args,result){
 assert(args&&isAbsolute(args.sourceRoot)&&isAbsolute(args.output)&&args.output.endsWith('.json'),'Absolute JSON output required');
 const target=resolve(args.output),source=resolve(args.sourceRoot);assert(!contains(source,target)&&!contains(website,target),'Stage coverage outside source and website');
 assert(!existsSync(target),'Coverage output already exists');const parent=dirname(target);assert(lstatSync(parent).isDirectory()&&!lstatSync(parent).isSymbolicLink(),'Regular output parent required');assert.equal(realpathSync(parent),resolve(parent),'Linked output ancestor');
 assert.equal(result.sourceRevision,args.revision);assert(result.evidence?.sourceInputs&&Object.keys(result.evidence.sourceInputs).length>0,'Coverage output needs exact provenance');
 for(const key of ['clinicalApproval','clinicalApprovalAsserted','anatomicalCompletenessProven','patientRegistrationAsserted'])assert.notEqual(result[key],true,'Coverage cannot confer approval or registration');
 writeFileSync(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
