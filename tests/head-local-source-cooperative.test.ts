import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openHeadPackageFromLocalSource} from '../lib/head-local-source.ts';

const origin='http://127.0.0.1:3000';
const headers={'x-visible-medicine-local':'1'};
const image=Uint8Array.from({length:4*1024*1024},(_,i)=>i%251);
const mask=new Uint8Array([1,0]);
const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const entry={id:'test',label:'Fixture',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[0,0,0],native_shape_kji:[1,1024,1024],ijk_to_ras:affine}};
const entries=(n:number)=>Array.from({length:n},(_,i)=>({...entry,id:`test.${i}`}));
const imageSpec={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[1,1024,1024],ijk_to_ras:affine};
const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageSpec,entries:entries(355)},MRI:{image:imageSpec,entries:entries(117)}}});

function tracked(chunks:Uint8Array[]){
  const state={reads:0,cancels:0,releases:0};
  const reader={
    async read(){const value=chunks[state.reads++];return value?{done:false,value}:{done:true,value:undefined};},
    async cancel(){state.cancels++;},
    releaseLock(){state.releases++;},
  };
  return {response:{ok:true,headers:new Headers(headers),body:{getReader(){return reader;}}} as unknown as Response,state};
}
async function asset(response:Response,parentSignal?:AbortSignal){
  const fetcher=(async(input:RequestInfo|URL)=>String(input).includes('/manifest.json')?new Response(manifest,{headers}):response) as typeof fetch;
  const pkg=await openHeadPackageFromLocalSource(fetcher,origin,hash(manifest),parentSignal);
  assert.ok(pkg);const file=pkg.files.get('image.bin');assert.ok(file);return file;
}

test('a queued timer runs before a single giant chunk completes; copy uses one destination and preserves view offsets',async()=>{
  const backing=new Uint8Array(image.length+19);backing.set(image,11);
  const trackedBody=tracked([backing.subarray(11,11+image.length)]);
  const file=await asset(trackedBody.response);
  let timerRan=false,completedAfterTimer=false;
  const NativeUint8Array=globalThis.Uint8Array;let fullAllocations=0;
  globalThis.Uint8Array=new Proxy(NativeUint8Array,{construct(target,args,newTarget){
    if(args[0]===image.length)fullAllocations++;
    return Reflect.construct(target,args,newTarget);
  }}) as Uint8ArrayConstructor;
  let result:ArrayBuffer;
  try{
    setTimeout(()=>{timerRan=true;},0);
    result=await file.arrayBuffer(undefined,progress=>{if(progress.loadedBytes===image.length)completedAfterTimer=timerRan;});
  }finally{globalThis.Uint8Array=NativeUint8Array;}
  assert.equal(completedAfterTimer,true);
  assert.equal(fullAllocations,1);
  assert.equal(hash(new Uint8Array(result)),hash(image));
  assert.deepEqual(new Uint8Array(result),image);
  assert.equal(trackedBody.state.cancels,0);
  assert.equal(trackedBody.state.releases,1);
  assert.equal(trackedBody.state.reads,2,'read to EOF after exact declared length');
});

test('cumulative tiny chunks yield to a queued timer',async()=>{
  const chunks=Array.from({length:image.length/512},(_,i)=>image.subarray(i*512,(i+1)*512));
  const trackedBody=tracked(chunks),file=await asset(trackedBody.response);
  let timerRan=false,completedAfterTimer=false;
  setTimeout(()=>{timerRan=true;},0);
  const result=await file.arrayBuffer(undefined,progress=>{if(progress.loadedBytes===image.length)completedAfterTimer=timerRan;});
  assert.equal(completedAfterTimer,true);
  assert.equal(hash(new Uint8Array(result)),hash(image));
  assert.equal(trackedBody.state.reads,chunks.length+1);
  assert.equal(trackedBody.state.releases,1);
});

for(const kind of ['empty','one-byte'] as const){
  test(`timer aborts before EOF across many immediately-resolving ${kind} chunks below the byte budget`,async()=>{
    const chunks=Array.from({length:1024},(_,i)=>kind==='empty'?new Uint8Array(0):image.subarray(i,i+1));
    const body=tracked(chunks),file=await asset(body.response);
    const controller=new AbortController();let timerRan=false;
    setTimeout(()=>{timerRan=true;controller.abort();},0);
    await assert.rejects(file.arrayBuffer(controller.signal),{name:'AbortError'});
    assert.equal(timerRan,true);
    assert.ok(body.state.reads<chunks.length,'the queued timer must run before EOF');
    assert.equal(body.state.cancels,1);
    assert.equal(body.state.releases,1);
  });
}

for(const target of ['asset','parent'] as const){
  test(`timer aborts ${target} during a giant chunk, cancelling and releasing the reader`,async()=>{
    const trackedBody=tracked([image]);const parent=new AbortController(),assetController=new AbortController();
    const file=await asset(trackedBody.response,parent.signal);
    setTimeout(()=>{(target==='parent'?parent:assetController).abort();},0);
    await assert.rejects(file.arrayBuffer(assetController.signal),{name:'AbortError'});
    assert.equal(trackedBody.state.cancels,1);
    assert.equal(trackedBody.state.releases,1);
    assert.equal(trackedBody.state.reads,1,'abort before asking the producer for another chunk');
  });
}

test('a giant chunk reports the first copied MiB before yielding and lets its observer abort',async()=>{
  const body=tracked([image]),file=await asset(body.response),controller=new AbortController();
  const reported:number[]=[];
  await assert.rejects(file.arrayBuffer(controller.signal,progress=>{
    reported.push(progress.loadedBytes);
    if(progress.loadedBytes===1048576)controller.abort();
  }),{name:'AbortError'});
  assert.deepEqual(reported,[0,1048576]);
  assert.equal(body.state.reads,1);
  assert.equal(body.state.cancels,1);
  assert.equal(body.state.releases,1);
});

test('producer can reuse its backing only after each full chunk copy; truncation and late bytes clean up',async()=>{
  const half=image.length/2,reused=Uint8Array.from(image.subarray(0,half));
  let reads=0,cancels=0,releases=0;
  const response={ok:true,headers:new Headers(headers),body:{getReader(){return {
    async read(){reads++;if(reads===1)return {done:false,value:reused};if(reads===2){reused.fill(255);return {done:false,value:image.subarray(half)};}return {done:true,value:undefined};},
    async cancel(){cancels++;},releaseLock(){releases++;},
  };}}} as unknown as Response;
  const result=new Uint8Array(await (await asset(response)).arrayBuffer());
  assert.equal(hash(result),hash(image));assert.equal(reads,3);assert.equal(cancels,0);assert.equal(releases,1);
  for(const chunks of [[image.subarray(0,-1)],[image,new Uint8Array([1])]]){
    const body=tracked(chunks);
    await assert.rejects((await asset(body.response)).arrayBuffer(),/missing or too large/);
    assert.equal(body.state.cancels,1);assert.equal(body.state.releases,1);
    assert.equal(body.state.reads,2);
  }
});
