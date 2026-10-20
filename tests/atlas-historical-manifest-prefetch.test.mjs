import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHistoricalTree,preloadHistoricalManifest} from './atlas-historical-manifest-prefetch.mjs';

const epoch='a'.repeat(40);
const blob=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=files=>Buffer.from(JSON.stringify({files:files.map(([path,bytes])=>({path,importedSha256:sha(bytes)}))}));
const row=(path,bytes,mode='100644',type='blob')=>`${mode} ${type} ${blob(bytes)}\t${path}\0`;
function fixture(paths,{tree,readerError,manifestEntries,closeError}={}){
 const manifestBytes=manifestEntries?Buffer.from(JSON.stringify({files:manifestEntries})):manifest(paths);
 const objects=new Map([[blob(manifestBytes),manifestBytes],...paths.map(([,bytes])=>[blob(bytes),bytes])]);
 const listing=tree??row('atlas-review/manifest.json',manifestBytes)+paths.map(([path,bytes])=>row('atlas-review/'+path,bytes)).join('');
 const calls=[],cache=new Map();let closed=0,reads=0;
 const runGit=(name,args)=>{calls.push([name,...args]);return args[0]==='rev-parse'?Buffer.from(epoch+'\n'):Buffer.from(listing);};
 const readerFactory=()=>({async readBlob(oid){reads++;if(readerError)throw readerError;const bytes=objects.get(oid);assert(bytes,'Missing test object');assert.equal(blob(bytes),oid);return bytes;},async close(){closed++;if(closeError)throw closeError;}});
 return {options:{cwd:'unused',epoch,cache,readerFactory,runGit},cache,calls,get closed(){return closed;},get reads(){return reads;},manifestBytes};
}

test('fixed-epoch preload retains exact bytes, SHA and one read for duplicate blob IDs',async()=>{
 const bytes=Buffer.from('one exact historical byte payload');
 const f=fixture([['content/one.ts',bytes],['content/two.ts',bytes]]);
 const result=await preloadHistoricalManifest(f.options);
 assert.deepEqual(result,{paths:2,uniqueBlobs:2}); // manifest plus one shared source blob
 assert.equal(f.reads,2);
 assert.equal(f.closed,1);
 assert.deepEqual(f.calls.map(call=>call[1]),['rev-parse','ls-tree']);
 assert.deepEqual(f.cache.get('atlas-review/content/one.ts'),bytes);
 assert.equal(sha(f.cache.get('atlas-review/content/two.ts')),sha(bytes));
 assert.equal(f.cache.get('atlas-review/manifest.json'),f.manifestBytes);
});

test('missing, duplicate and non-blob historical paths fail without a partial cache',async()=>{
 const bytes=Buffer.from('source');
 const missing=fixture([['content/one.ts',bytes]],{tree:row('atlas-review/manifest.json',manifest([['content/one.ts',bytes]]))});
 await assert.rejects(preloadHistoricalManifest(missing.options),/Missing historical Git path/);
 assert.equal(missing.closed,1);assert.equal(missing.cache.size,0);
 const duplicate=fixture([['content/one.ts',bytes]],{tree:row('atlas-review/manifest.json',manifest([['content/one.ts',bytes]]))+row('atlas-review/manifest.json',manifest([['content/one.ts',bytes]]))});
 await assert.rejects(preloadHistoricalManifest(duplicate.options),/Duplicate Git tree path/);
 assert.equal(duplicate.closed,0);assert.equal(duplicate.cache.size,0);
 const repeatedManifest=fixture([['content/one.ts',bytes],['content/one.ts',bytes]],{tree:row('atlas-review/manifest.json',manifest([['content/one.ts',bytes],['content/one.ts',bytes]]))+row('atlas-review/content/one.ts',bytes)});
 await assert.rejects(preloadHistoricalManifest(repeatedManifest.options),/Duplicate historical manifest path/);
 assert.equal(repeatedManifest.closed,1);assert.equal(repeatedManifest.cache.size,0);
 const nonblob=fixture([['content/one.ts',bytes]],{tree:row('atlas-review/manifest.json',manifest([['content/one.ts',bytes]]))+row('atlas-review/content/one.ts',bytes,'160000','commit')});
 await assert.rejects(preloadHistoricalManifest(nonblob.options),/not a regular blob/);
 assert.equal(nonblob.closed,1);assert.equal(nonblob.cache.size,0);
 assert.throws(()=>parseHistoricalTree(Buffer.from('100644 blob '+blob(bytes)+'\tunsafe/../path\0')),/Unsafe Git tree path/);
});

test('malformed and foreign manifest SHA-256 values refuse atomic cache admission',async()=>{
 const bytes=Buffer.from('source');
 for(const importedSha256 of [undefined,42,sha(bytes).toUpperCase(),sha(bytes).slice(1),'f'.repeat(64)]){
  const f=fixture([['content/one.ts',bytes]],{manifestEntries:[{path:'content/one.ts',importedSha256}]});
  const sentinel=Buffer.from('pre-existing exact bytes');f.cache.set('sentinel',sentinel);
  await assert.rejects(preloadHistoricalManifest(f.options),/historical imported SHA-256/i);
  assert.equal(f.closed,1);
  assert.deepEqual([...f.cache],[['sentinel',sentinel]],'Earlier process-local entries stay byte-exact');
  assert.deepEqual(f.calls.map(call=>call[1]),['rev-parse','ls-tree']);
 }
});

test('failed close blocks cache admission and preserves primary failure evidence',async()=>{
 const bytes=Buffer.from('source'),closeError=new Error('close failed');
 const f=fixture([['content/one.ts',bytes]],{closeError});
 const sentinel=Buffer.from('older');f.cache.set('sentinel',sentinel);
 await assert.rejects(preloadHistoricalManifest(f.options),closeError);
 assert.equal(f.closed,1);assert.deepEqual([...f.cache],[['sentinel',sentinel]]);
 const both=fixture([['content/one.ts',bytes]],{readerError:new Error('read failed'),closeError});
 await assert.rejects(preloadHistoricalManifest(both.options),error=>error instanceof AggregateError&&error.errors.length===2&&error.errors[0].message==='read failed'&&error.errors[1]===closeError);
 assert.equal(both.closed,1);assert.equal(both.cache.size,0);
});

test('reader rejects OID or size errors; cleanup and no fallback remain exact',async()=>{
 const bytes=Buffer.from('source');
 for(const error of [new Error('Git blob content hash mismatch'),new Error('Git blob exceeds byte limit')]){
  const f=fixture([['content/one.ts',bytes]],{readerError:error});
  await assert.rejects(preloadHistoricalManifest(f.options),error);
  assert.equal(f.closed,1);assert.equal(f.cache.size,0);
  assert.deepEqual(f.calls.map(call=>call[1]),['rev-parse','ls-tree']);
 }
 const bad=fixture([['content/one.ts',bytes]]);
 bad.options.runGit=(name,args)=>args[0]==='rev-parse'?Buffer.from('b'.repeat(40)+'\n'):Buffer.from('');
 await assert.rejects(preloadHistoricalManifest(bad.options),/Historical commit moved/);
 assert.equal(bad.closed,0);assert.equal(bad.cache.size,0);
});
