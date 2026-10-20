// Test-only, process-local historical preload. The caller supplies the verified blob reader.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const gitOptions=cwd=>({cwd,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const safePath=path=>typeof path==='string'&&path.length>0&&!path.includes('\\')&&!path.startsWith('/')&&!path.split('/').some(part=>part===''||part==='.'||part==='..');

export function parseHistoricalTree(bytes){
 const entries=new Map();
 const rows=bytes.toString('utf8').split('\0');
 assert.equal(rows.pop(),'','Unterminated Git tree listing');
 for(const row of rows){
  const match=/^(\d{6}) ([^ ]+) ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
  assert(match,'Invalid Git tree entry');
  const [,mode,type,oid,path]=match;
  assert(safePath(path),'Unsafe Git tree path');
  assert(!entries.has(path),'Duplicate Git tree path: '+path);
  entries.set(path,{mode,type,oid});
 }
 return entries;
}

export async function preloadHistoricalManifest({cwd,epoch,cache,readerFactory,runGit=execFileSync}){
 assert.match(epoch,/^[a-f0-9]{40}$/,'Expected fixed historical commit');
 assert(cache instanceof Map,'Expected process-local byte map');
 assert.equal(typeof readerFactory,'function');
 const options=gitOptions(cwd);
 const commit=runGit('git',['rev-parse',epoch+'^{commit}'],options).toString().trim();
 assert.equal(commit,epoch,'Historical commit moved or is not a commit');
 const tree=parseHistoricalTree(runGit('git',['ls-tree','-r','-z','--full-tree',epoch],options));
 const manifestPath='atlas-review/manifest.json';
 const staged=new Map(),oids=new Map();
 const reader=readerFactory({cwd,maxBytes:32e6});
 let result, failure;
 try{
  async function fetch(path){
   assert(safePath(path),'Unsafe historical path');
   const item=tree.get(path);
   assert(item,'Missing historical Git path: '+path);
   assert(['100644','100755'].includes(item.mode)&&item.type==='blob','Historical path is not a regular blob: '+path);
   if(!oids.has(item.oid))oids.set(item.oid,reader.readBlob(item.oid));
   const bytes=await oids.get(item.oid);
   assert(Buffer.isBuffer(bytes),'Historical Git blob reader returned non-bytes');
   staged.set(path,bytes);
   return bytes;
  }
  const manifest=JSON.parse((await fetch(manifestPath)).toString('utf8'));
  assert(Array.isArray(manifest.files),'Historical manifest files missing');
  const seen=new Set();
  for(const file of manifest.files){
   assert(file&&safePath(file.path),'Unsafe historical manifest path');
   assert(!seen.has(file.path),'Duplicate historical manifest path: '+file.path);
   assert(typeof file.importedSha256==='string'&&/^[a-f0-9]{64}$/.test(file.importedSha256),'Malformed historical imported SHA-256: '+file.path);
   seen.add(file.path);
   const bytes=await fetch('atlas-review/'+file.path);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),file.importedSha256,'Historical imported SHA-256 mismatch: '+file.path);
  }
  result={paths:seen.size,uniqueBlobs:oids.size};
 }catch(error){failure=error;}
 try{await reader.close();}catch(error){failure=failure?new AggregateError([failure,error],'Historical prefetch and reader cleanup failed'):error;}
 if(failure)throw failure;
 // Commit only after every blob, manifest digest and reader cleanup succeeds.
 for(const [path,bytes] of staged)cache.set(path,bytes);
 return result;
}
