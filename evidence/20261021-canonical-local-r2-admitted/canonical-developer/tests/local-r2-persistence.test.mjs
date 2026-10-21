import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {test} from 'node:test';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {localCandidateMiniflareOptions} from '../scripts/local-r2-persistence.mjs';

const bytes=Buffer.from('Visible Medicine synthetic local R2 persistence probe\n');
const key='synthetic/nonpatient-persistence-probe';
const digest=createHash('sha256').update(bytes).digest('hex');

test('legacy option loses local R2 on disposal; corrected option retains exact object',async()=>{
 const temporaryParent=path.resolve(import.meta.dirname,'../.wrangler/test-state');
 await fs.mkdir(temporaryParent,{recursive:true});
 const temporary=await fs.mkdtemp(path.join(temporaryParent,'vm-local-r2-'));
 try{
  const oldRoot=path.join(temporary,'old');
  const oldOptions=convertV4MiniflareOptions({name:'vm-local-candidate-staging',modules:true,
   script:'export default {fetch(){return new Response("Local staging only",{status:404})}};',
   compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,r2Buckets:{FILES:'site-creator-r2'},
   r2Persist:path.join(oldRoot,'.wrangler','state','v3','r2'),log:new Log(LogLevel.NONE)});
  assert.equal(oldOptions.resourcePersistencePath,undefined);
  let emulator=new Miniflare(oldOptions);
  try{
   const bucket=await emulator.getR2Bucket('FILES');
   await bucket.put(key,bytes,{sha256:digest});
   assert.deepEqual(Buffer.from(await (await bucket.get(key)).arrayBuffer()),bytes);
  }finally{await emulator.dispose();}
  emulator=new Miniflare(oldOptions);
  try{assert.equal(await (await emulator.getR2Bucket('FILES')).get(key),null);}
  finally{await emulator.dispose();}

  const fixedRoot=path.join(temporary,'fixed');
  const fixedOptions=localCandidateMiniflareOptions(fixedRoot);
  assert.equal(fixedOptions.resourcePersistencePath,path.join(fixedRoot,'.wrangler','state','v3'));
  emulator=new Miniflare(fixedOptions);
  try{
   const bucket=await emulator.getR2Bucket('FILES');
   const stored=await bucket.put(key,bytes,{sha256:digest});
   assert.equal(stored.size,bytes.length);
  }finally{await emulator.dispose();}
  emulator=new Miniflare(fixedOptions);
  try{
   const object=await (await emulator.getR2Bucket('FILES')).get(key);
   assert.ok(object);
   assert.equal(object.size,bytes.length);
   const recovered=Buffer.from(await object.arrayBuffer());
   assert.deepEqual(recovered,bytes);
   assert.equal(createHash('sha256').update(recovered).digest('hex'),digest);
  }finally{await emulator.dispose();}
 }finally{
  const resolved=path.resolve(temporary),relative=path.relative(temporaryParent,resolved);
  assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));
  assert(path.basename(resolved).startsWith('vm-local-r2-'));
  assert.equal(await fs.realpath(resolved),resolved);
  await fs.rm(resolved,{recursive:true,force:true});
 }
});

test('local option builder rejects relative roots and exposes only loopback resources',()=>{
 assert.throws(()=>localCandidateMiniflareOptions('relative-root'));
 const options=localCandidateMiniflareOptions(path.resolve(import.meta.dirname,'..'));
 assert.equal(options.host,'127.0.0.1');assert.equal(options.port,0);
 assert(!JSON.stringify(options).includes('remoteProxyConnectionString'));
});
