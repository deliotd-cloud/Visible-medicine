import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {request as httpRequest} from 'node:http';
import test from 'node:test';
import ts from 'typescript';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {gzipAtlasDelivery} from '../lib/atlas-model-delivery.ts';
import {verifyAtlasModelDownload} from '../lib/atlas-model-download.ts';

test('Workers gzip is byte-exact through the security wrapper; canonical ranges and immutable storage remain intact', {timeout:60000}, async(t)=>{
 const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
 const model=inventory.models.find((m:{paths:string[]})=>m.paths.some(p=>p.endsWith('/thorax-skeleton.glb')));
 const largest=[...inventory.models].sort((a,b)=>b.bytes-a.bytes)[0];
 assert(model);const bytes=readFileSync('public'+model.paths[0]);
 const modules=['atlas-model-storage','atlas-model-delivery','atlas-content-encoding'].map(name=>({type:'ESModule' as const,path:resolve('lib/'+name+'.ts'),contents:ts.transpileModule(readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText}));
 const worker=`import {handleAtlasDelivery} from '../lib/atlas-model-delivery.ts';
 import {AtlasModelError} from '../lib/atlas-model-storage.ts';
 export default {async fetch(request,env){
 const response=await handleAtlasDelivery(request,${JSON.stringify(model.sha256===largest.sha256?[model]:[model,largest])},env.FILES,async()=>{if(request.headers.get('x-fixture-role')!=='admin')throw new AtlasModelError('Denied',403);});
 const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');
 return new Response(response.body,{status:response.status,headers});
 }};`;
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('tests/compressed-delivery-worker.mjs'),contents:worker},...modules],compatibilityDate:'2026-08-23',r2Buckets:['FILES'],log:new Log(LogLevel.NONE)}));
 try{
  const bucket=await mf.getR2Bucket('FILES'),key=`atlas-models/v1/${model.sha256}.glb`;
  await bucket.put(key,bytes,{sha256:model.sha256});const before=await bucket.head(key);
  const url=new URL(model.paths[0],await mf.ready);
  // dispatchFetch transparently decodes and removes Content-Encoding. Exercise
  // real workerd HTTP with a raw client to catch accidental double encoding.
  const call=(headers:Record<string,string>={},method='GET',target=url)=>new Promise<Response>((resolveResponse,reject)=>{
   const req=httpRequest(target,{method,headers:{'x-fixture-role':'admin','accept-encoding':'gzip',...headers}},res=>{
    const chunks:Buffer[]=[];let size=0;
    res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>32*1024*1024)req.destroy(Error('Fixture reply exceeded bound'));else chunks.push(chunk);});
    res.on('error',reject);res.on('end',()=>{
     const responseHeaders=new Headers();for(const [key,value]of Object.entries(res.headers))if(value!==undefined)responseHeaders.set(key,Array.isArray(value)?value.join(', '):value);
     resolveResponse(new Response(method==='HEAD'||res.statusCode===304?null:Buffer.concat(chunks),{status:res.statusCode,headers:responseHeaders}));
    });
   });req.on('error',reject);req.end();
  });
  const full=await call();assert.equal(full.status,200);
  assert.equal(full.headers.get('content-encoding'),'gzip');assert.equal(full.headers.get('etag'),`W/"${model.sha256}"`);
  assert.equal(full.headers.get('cache-control'),'private, no-store');assert.equal(full.headers.get('vary'),'Cookie, Accept-Encoding');
  // Raw HTTP exposes the actual encoded body; decompress exactly once.
  const wire=Buffer.from(await full.arrayBuffer());assert(wire.length<bytes.length);
  t.diagnostic(JSON.stringify({canonicalBytes:bytes.length,wireBytes:wire.length,sha256:model.sha256,transport:'raw workerd HTTP, gzip decoded once'}));
  assert.deepEqual(gunzipSync(wire),bytes);assert.equal(createHash('sha256').update(gunzipSync(wire)).digest('hex'),model.sha256);
  // Browser Fetch transparently decodes but keeps encoded response headers.
  const browserHeaders=new Headers(full.headers);browserHeaders.set('Content-Length',String(wire.length));
  assert.equal((await verifyAtlasModelDownload(new Response(bytes,{headers:browserHeaders}),model)).sha256,model.sha256);
  for(const encoding of ['identity','gzip;q=0','br']){
   const identity=await call({'accept-encoding':encoding});assert.equal(identity.headers.get('content-encoding'),null);
   assert.equal(identity.headers.get('etag'),`"${model.sha256}"`);assert.deepEqual(Buffer.from(await identity.arrayBuffer()),bytes);
  }
  const head=await call({},'HEAD');assert.equal(head.status,200);assert.equal(head.headers.get('content-encoding'),'gzip');
  assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(head.headers.get('content-length'),null);
  for(const ifNoneMatch of [`"${model.sha256}"`,`W/"${model.sha256}"`,'*']){
   const cached=await call({'if-none-match':ifNoneMatch});assert.equal(cached.status,304);assert.equal(cached.headers.get('etag'),`W/"${model.sha256}"`);
   assert.equal((await cached.arrayBuffer()).byteLength,0);
  }
  const range=await call({range:'bytes=0-11'});assert.equal(range.status,206);assert.equal(range.headers.get('content-encoding'),null);
  assert.equal(range.headers.get('content-range'),`bytes 0-11/${bytes.length}`);assert.deepEqual(Buffer.from(await range.arrayBuffer()),bytes.subarray(0,12));
  for(const ifRange of ['"stale"',`W/"${model.sha256}"`]){
   const fallback=await call({range:'bytes=0-11','if-range':ifRange});assert.equal(fallback.status,200);
   assert.equal(fallback.headers.get('content-encoding'),null);assert.deepEqual(Buffer.from(await fallback.arrayBuffer()),bytes);
  }
  assert.equal((await call({range:'bytes=0-1,4-5'})).status,416);
  for(const header of ['gzip;q=0,identity;q=0','br,identity;q=0']){const rejected=await call({'accept-encoding':header});assert.equal(rejected.status,406,header+': '+await rejected.text());}
  assert.equal((await call({range:'bytes=0-11','accept-encoding':'gzip,identity;q=0'})).status,406);
  const deniedVariants:Record<string,string>[]=[{},{range:'bytes=0-11'},{'if-none-match':`"${model.sha256}"`},{'accept-encoding':'*;q=0'}];
  for(const method of ['GET','HEAD'])for(const extra of deniedVariants){
   const denied=await call({...extra,'x-fixture-role':'denied'},method);assert.equal(denied.status,403);
   assert.notEqual(denied.headers.get('content-type'),'model/gltf-binary');assert.equal(denied.headers.get('etag'),null);
  }
  assert.equal((await bucket.head(key))?.version,before?.version,'Delivery must not overwrite source objects');
  const largestBytes=readFileSync('public'+largest.paths[0]);
  await bucket.put(`atlas-models/v1/${largest.sha256}.glb`,largestBytes,{sha256:largest.sha256});
  const large=await call({},'GET',new URL(largest.paths[0],url));assert.equal(large.status,200);
  const largeWire=Buffer.from(await large.arrayBuffer());
  assert.deepEqual(gunzipSync(largeWire),largestBytes);
  t.diagnostic(JSON.stringify({largestCanonicalBytes:largestBytes.length,largestWireBytes:largeWire.length,sha256:largest.sha256}));
  await bucket.put(key,bytes.subarray(0,40));assert.equal((await call()).status,409,'Mismatched storage never gets compressed/served');
 }finally{await mf.dispose();}
});

test('compressed stream cancellation propagates to a stalled upstream model', async()=>{
 let cancelled=false;
 const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(1024));},cancel(){cancelled=true;}});
 const response=gzipAtlasDelivery(new Response(body,{headers:{'X-Atlas-Delivery':'registered-storage-v1'}}),'1'.repeat(64));
 assert.equal(response.status,200);await response.body!.cancel();
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(cancelled,true);
 assert.match(readFileSync('worker/index.ts','utf8'),/return new Response\(response.body, \{ status: response.status, statusText: response.statusText, headers \}\)/,'Actual security wrapper retains native automatic encoding');
});

test('an upstream model stream failure rejects compression instead of returning partial success', async()=>{
 const body=new ReadableStream<Uint8Array>({start(controller){controller.error(Error('Fixture upstream interrupted'));}});
 const response=gzipAtlasDelivery(new Response(body),'1'.repeat(64));
 await assert.rejects(response.arrayBuffer(),/Fixture upstream interrupted/);
});
