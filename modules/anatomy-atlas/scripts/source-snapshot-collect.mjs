// Read-only, exhaustive collector for an already prepared source stage.
// This supplies observed bytes only; it makes no admission or rights decision.
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat, realpath, readdir, open} from 'node:fs/promises';
import {isAbsolute, join, resolve} from 'node:path';
import {SnapshotValidationError, validateSnapshotPathWithReview, validateReviewedPolicySource,
  validateReviewedSnapshotIdentity} from './source-snapshot-manifest.mjs';

const fail=(code,detail)=>{throw new SnapshotValidationError(code,detail);};
const samePath=(a,b)=>process.platform==='win32'
  ? a.replaceAll('/','\\').toLowerCase()===b.replaceAll('/','\\').toLowerCase() : a===b;
const fingerprint=stat=>[stat.dev,stat.ino,stat.mode,stat.nlink,stat.size,
  stat.mtimeNs,stat.ctimeNs,stat.birthtimeNs].map(String).join('|');
const sameStat=(a,b)=>fingerprint(a)===fingerprint(b);
const safeStat=async path=>{
  try{return await lstat(path,{bigint:true});}
  catch(error){fail('FILE_CHANGED',`${path}: ${error.code??'lstat failed'}`);}
};
const safeRealpath=async path=>{
  try{return await realpath(path);}
  catch(error){fail('FILE_CHANGED',`${path}: ${error.code??'realpath failed'}`);}
};
const safeEntries=async path=>{
  try{return (await readdir(path)).sort((a,b)=>a<b?-1:a>b?1:0);}
  catch(error){fail('FILE_CHANGED',`${path}: ${error.code??'readdir failed'}`);}
};
const optionsLimit=(value,name)=>{
  if(!Number.isSafeInteger(value)||value<1)fail('COLLECTION_LIMIT',`${name} must be a positive safe integer`);
  return value;
};

export async function collectObservedSnapshot(root,options={}){
  if(typeof root!=='string'||!isAbsolute(root))fail('UNSAFE_PATH','stage root must be absolute');
  const lexical=resolve(root);
  if(!samePath(root,lexical))fail('UNSAFE_PATH','stage root must be a normalized absolute directory');
  if(!options||typeof options!=='object'||Array.isArray(options)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(options))||
     Reflect.ownKeys(options).some(key=>!['maxFiles','maxBytes','maxDepth','sourceCommit','reviewedPathPolicy'].includes(key)||
       !Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))
    fail('COLLECTION_LIMIT','only bounded collection and explicit reviewed-source options are supported');
  const reviewedPathPolicy=options.reviewedPathPolicy;
  if(Object.hasOwn(options,'sourceCommit')!==Object.hasOwn(options,'reviewedPathPolicy') ||
     Object.hasOwn(options,'reviewedPathPolicy')&&reviewedPathPolicy===undefined)
    fail('REVIEWED_POLICY_SOURCE','sourceCommit and reviewedPathPolicy must be supplied together');
  validateReviewedPolicySource(reviewedPathPolicy,options.sourceCommit);
  const maxFiles=optionsLimit(Object.hasOwn(options,'maxFiles')?options.maxFiles:20000,'maxFiles');
  const maxBytes=optionsLimit(Object.hasOwn(options,'maxBytes')?options.maxBytes:8*1024**3,'maxBytes');
  const maxDepth=optionsLimit(Object.hasOwn(options,'maxDepth')?options.maxDepth:32,'maxDepth');
  const initialRoot=await safeStat(lexical);
  if(initialRoot.isSymbolicLink()||!initialRoot.isDirectory())fail('NONREGULAR_FILE','stage root is not an ordinary directory');
  if(!samePath(await safeRealpath(lexical),lexical))fail('PATH_ALIAS','stage root resolves elsewhere');

  const observed=[],folded=new Set(),resolvedSeen=new Set();
  let files=0,directories=0,totalBytes=0;
  const checkPath=async(full,relative,stat)=>{
    validateSnapshotPathWithReview(relative,reviewedPathPolicy,stat.isDirectory()?'directory':'file');
    const lower=relative.toLowerCase();
    if(folded.has(lower))fail('CASE_COLLISION',relative);
    folded.add(lower);
    if(stat.isSymbolicLink())fail('NONREGULAR_FILE',`${relative}: symlink or junction`);
    const canonical=await safeRealpath(full);
    if(!samePath(canonical,full))fail('PATH_ALIAS',relative);
    const resolvedKey=process.platform==='win32'?canonical.toLowerCase():canonical;
    if(resolvedSeen.has(resolvedKey))fail('PATH_ALIAS',relative);
    resolvedSeen.add(resolvedKey);
  };
  const checkDirectory=async(full,relative,depth,stat)=>{
    if(depth>maxDepth)fail('COLLECTION_LIMIT',`${relative}: depth exceeds ${maxDepth}`);
    if(relative){
      directories++;
      if(directories>maxFiles)fail('COLLECTION_LIMIT','directory count exceeds maxFiles');
      await checkPath(full,relative,stat);
    }
    const names=await safeEntries(full);
    for(const name of names){
      const childRelative=relative?`${relative}/${name}`:name;
      validateSnapshotPathWithReview(childRelative,reviewedPathPolicy,'entry');
      const child=join(full,name),before=await safeStat(child);
      if(before.isDirectory())await checkDirectory(child,childRelative,depth+1,before);
      else{
        await checkPath(child,childRelative,before);
        if(!before.isFile()||before.nlink!==1n)fail('NONREGULAR_FILE',`${childRelative}: nonregular or hardlinked file`);
        files++;
        if(files>maxFiles)fail('COLLECTION_LIMIT','file count exceeds maxFiles');
        if(before.size>BigInt(Number.MAX_SAFE_INTEGER)||BigInt(totalBytes)+before.size>BigInt(maxBytes))
          fail('COLLECTION_LIMIT',`${childRelative}: byte limit exceeded`);
        let handle;
        try{
          handle=await open(child,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
          const opened=await handle.stat({bigint:true});
          if(!sameStat(before,opened)||!opened.isFile()||opened.nlink!==1n)
            fail('FILE_CHANGED',`${childRelative}: changed before read`);
          const digest=createHash('sha256');
          const gitDigest=reviewedPathPolicy===undefined?null:createHash('sha1').update(`blob ${before.size}\0`);
          let count=0;
          for await(const chunk of handle.createReadStream({autoClose:false,highWaterMark:1024*1024})){
            count+=chunk.length;
            if(BigInt(totalBytes)+BigInt(count)>BigInt(maxBytes)||BigInt(count)>before.size)
              fail('FILE_CHANGED',`${childRelative}: changed during read`);
            digest.update(chunk);
            gitDigest?.update(chunk);
          }
          const afterHandle=await handle.stat({bigint:true});
          const afterPath=await safeStat(child);
          if(BigInt(count)!==before.size||!sameStat(before,afterHandle)||!sameStat(before,afterPath)||
             !samePath(await safeRealpath(child),child))
            fail('FILE_CHANGED',`${childRelative}: changed after read`);
          totalBytes+=count;
          const row={path:childRelative,sha256:digest.digest('hex'),bytes:count,
            entryType:'file',isSymbolicLink:false,...(gitDigest?{gitBlob:gitDigest.digest('hex')}:{})};
          validateReviewedSnapshotIdentity(reviewedPathPolicy,row);
          observed.push(row);
        }catch(error){
          if(error instanceof SnapshotValidationError)throw error;
          fail('FILE_CHANGED',`${childRelative}: ${error.code??'read failed'}`);
        }finally{if(handle)await handle.close();}
      }
    }
    const after=await safeStat(full),afterNames=await safeEntries(full);
    if(!after.isDirectory()||!sameStat(stat,after)||
       names.length!==afterNames.length||names.some((name,index)=>name!==afterNames[index])||
       !samePath(await safeRealpath(full),full))
      fail('FILE_CHANGED',`${relative||'<root>'}: directory changed during collection`);
  };
  await checkDirectory(lexical,'',0,initialRoot);
  if(!observed.length)fail('EMPTY_STAGE','stage must contain at least one regular file');
  return observed.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
