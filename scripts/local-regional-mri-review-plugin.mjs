import {constants,closeSync,fstatSync,lstatSync,openSync,readSync,realpathSync} from 'node:fs';
import {isAbsolute,resolve,relative,dirname,join,sep} from 'node:path';
import {regionalMriReviewProjection} from '../lib/regional-mri-package.ts';

const VIRTUAL='virtual:visible-medicine-regional-review';
const RESOLVED='\0'+VIRTUAL;
const CONTEXT='virtual:visible-medicine-regional-review-context';
const CONTEXT_RESOLVED='\0'+CONTEXT;
const MAX_CONFIG=4096;
const HASH=/^[a-f0-9]{64}$/;
const REGIONS=new Set(['knee','head-neck','shoulder','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine']);
const KEYS=new Set(['schema','revision','label','region']);
const ERROR='Invalid local regional MRI review binding.';
const NULL_MODULE='export default null;';
const GENERIC_DENY='**/.local/regional-mri-review-binding.json';
const normalizePath=path=>path.replace(/\\/g,'/');
const CONTEXT_ERROR='Invalid local regional MRI review context.';
const MAX_MANIFEST=8388608;
const sameFile=(a,b)=>a.isFile()&&b.isFile()&&a.nlink===1&&b.nlink===1&&
  a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;

function flatStringObject(text){
  let index=0;
  const whitespace=()=>{while(/[ \t\r\n]/.test(text[index]??'!'))index++;};
  const quoted=()=>{
    if(text[index]!=='"')throw new Error(ERROR);
    const start=index++;
    while(index<text.length){
      if(text[index]==='\\'){index+=2;continue;}
      if(text[index++]==='"')return JSON.parse(text.slice(start,index));
    }
    throw new Error(ERROR);
  };
  whitespace();if(text[index++]!=='{')throw new Error(ERROR);
  const value=Object.create(null);whitespace();
  if(text[index]==='}')throw new Error(ERROR);
  for(;;){
    whitespace();const key=quoted();whitespace();if(text[index++]!==':'||Object.hasOwn(value,key))throw new Error(ERROR);
    whitespace();value[key]=quoted();whitespace();
    const separator=text[index++];
    if(separator==='}')break;
    if(separator!==',')throw new Error(ERROR);
  }
  whitespace();if(index!==text.length)throw new Error(ERROR);
  return value;
}

function bindingFromFile(path){
  if(path===undefined||path===null)return null;
  try{
    if(typeof path!=='string'||!isAbsolute(path)||!path)return new Error(ERROR);
    let stat;
    try{stat=lstatSync(path);}catch(error){if(error?.code==='ENOENT')return null;throw error;}
    if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size<1||stat.size>MAX_CONFIG||realpathSync(path)!==resolve(path))throw new Error(ERROR);
    const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    let bytes;
    try{
      const before=fstatSync(fd);
      if(!sameFile(stat,before))throw new Error(ERROR);
      const limited=Buffer.allocUnsafe(MAX_CONFIG+1);
      let count=0;
      while(count<limited.length){const received=readSync(fd,limited,count,limited.length-count,count);if(!received)break;count+=received;}
      if(count<1||count>MAX_CONFIG||!sameFile(before,fstatSync(fd))||!sameFile(before,lstatSync(path))||realpathSync(path)!==resolve(path))throw new Error(ERROR);
      bytes=limited.subarray(0,count);
    }finally{closeSync(fd);}
    const value=flatStringObject(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==4||Object.keys(value).some(key=>!KEYS.has(key))||
      value.schema!=='visible-medicine.regional-mri-review-binding/1'||typeof value.revision!=='string'||!HASH.test(value.revision)||
      typeof value.label!=='string'||!value.label.trim()||value.label.length>160||/[\u0000-\u001f\u007f]/.test(value.label)||
      typeof value.region!=='string'||!REGIONS.has(value.region))throw new Error(ERROR);
    return{revision:value.revision,label:value.label,region:value.region};
  }catch{return new Error(ERROR);}
}

function contained(root,path){const r=relative(resolve(root),resolve(path));return r!==''&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);}
function safePrivateRoot(root,websiteRoot){
 if(typeof root!=='string'||!isAbsolute(root)||dirname(resolve(root))===resolve(root)||root.startsWith('\\\\')||root.startsWith('//')||
  typeof websiteRoot!=='string'||!isAbsolute(websiteRoot)||resolve(root)===resolve(websiteRoot)||contained(websiteRoot,root)||contained(root,websiteRoot))throw Error(CONTEXT_ERROR);
}
function outsideGit(path){
 for(let current=dirname(resolve(path));;current=dirname(current)){
  try{lstatSync(join(current,'.git'));throw Error(CONTEXT_ERROR);}catch(error){if(error?.code!=='ENOENT')throw error;}
  if(dirname(current)===current)break;
 }
}
function privateManifestBytes(path,root){
 if(typeof path!=='string'||!isAbsolute(path)||!contained(root,path))throw Error(CONTEXT_ERROR);
 outsideGit(path);
 const stat=lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size<1||stat.size>MAX_MANIFEST||realpathSync(path)!==resolve(path))throw Error(CONTEXT_ERROR);
 const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{
  const before=fstatSync(fd);if(!sameFile(stat,before))throw Error(CONTEXT_ERROR);
  const limited=Buffer.allocUnsafe(MAX_MANIFEST+1);let count=0;
  while(count<limited.length){const received=readSync(fd,limited,count,limited.length-count,count);if(!received)break;count+=received;}
  if(count<1||count>MAX_MANIFEST||!sameFile(before,fstatSync(fd))||!sameFile(before,lstatSync(path))||realpathSync(path)!==resolve(path))throw Error(CONTEXT_ERROR);
  return limited.buffer.slice(limited.byteOffset,limited.byteOffset+count);
 }finally{closeSync(fd);}
}
async function contextFromFile(sourceFile,privateRoot,configFile){
 if(sourceFile===undefined||sourceFile===null||sourceFile==='')return null;
 try{
  const binding=bindingFromFile(configFile);if(binding instanceof Error)throw binding;if(!binding)return null;
  const projection=await regionalMriReviewProjection(privateManifestBytes(sourceFile,privateRoot),binding.revision);
  if(projection.region!==binding.region)throw Error(CONTEXT_ERROR);
  return projection;
 }catch{throw Error(CONTEXT_ERROR);}
}

/** A private local preview pin, never derived from the folder the user chooses. */
export function localRegionalMriReviewPlugin({configFile,sourceFile,privateRoot}={}){
  let command='build';
  let contextReady=false;
  const bound=configFile!==undefined&&configFile!==null;
  return{
    name:'visible-medicine-local-regional-mri-review',
    enforce:'pre',
    config(config,environment){
      contextReady=false;
      command=environment?.command==='serve'?'serve':'build';
      if(command!=='serve'||!bound)return;
      const host=config.server?.host;
      if(host!==undefined&&host!=='localhost'&&host!=='127.0.0.1'&&host!=='::1')
        throw new Error('Local regional MRI review requires a loopback development server.');
      return{server:{host:'127.0.0.1'}};
    },
    configResolved(config){
      if(command!=='serve'||config.command!=='serve'||!bound)return;
      if(config.server?.fs?.strict!==true||!['localhost','127.0.0.1','::1'].includes(config.server?.host)||
        typeof config.fsDenyGlob!=='function')
        throw new Error('Local regional MRI review requires a strict loopback Vite server with filesystem deny rules.');
      const deny=config.server?.fs?.deny;
      if(!Array.isArray(deny))throw new Error('Local regional MRI review requires Vite filesystem deny configuration.');
      const exact=typeof configFile==='string'&&isAbsolute(configFile)?normalizePath(resolve(configFile)):null;
      let privatePath=null;
      if(sourceFile){safePrivateRoot(privateRoot,config.root);if(typeof sourceFile!=='string'||!isAbsolute(sourceFile)||!contained(privateRoot,sourceFile))throw Error(CONTEXT_ERROR);privatePath=normalizePath(resolve(privateRoot));}
      for(const pattern of [exact,GENERIC_DENY,privatePath&&privatePath+'/**'])if(pattern&&!deny.includes(pattern))deny.push(pattern);
      // Vite compiles fsDenyGlob before configResolved. Extend the compiled matcher
      // as well, retaining every default and caller-provided deny decision.
      const previous=config.fsDenyGlob;
      config.fsDenyGlob=path=>{
        if(previous(path))return true;
        const normalized=normalizePath(path);
        return exact!==null&&normalized.toLowerCase()===exact.toLowerCase()||
          privatePath!==null&&(normalized.toLowerCase()===privatePath.toLowerCase()||normalized.toLowerCase().startsWith(privatePath.toLowerCase()+'/'))||
          /(?:^|\/)\.local\/regional-mri-review-binding\.json$/i.test(normalized);
      };
      contextReady=!!sourceFile;
    },
    resolveId(id){if(id===VIRTUAL)return RESOLVED;if(id===CONTEXT)return CONTEXT_RESOLVED;},
    load(id){
      if(id===CONTEXT_RESOLVED){
        if(command!=='serve'||!['rsc','ssr'].includes(this?.environment?.name))return NULL_MODULE;
        if(sourceFile&&!contextReady)return Promise.reject(Error(CONTEXT_ERROR));
        return contextFromFile(sourceFile,privateRoot,configFile).then(value=>value===null?NULL_MODULE:`export default ${JSON.stringify(value)};`);
      }
      if(id!==RESOLVED||command!=='serve'||!['rsc','ssr'].includes(this?.environment?.name))return id===RESOLVED?NULL_MODULE:null;
      const result=bindingFromFile(configFile);
      if(result instanceof Error)throw result;
      return result===null?NULL_MODULE:`export default ${JSON.stringify(result)};`;
    },
  };
}
