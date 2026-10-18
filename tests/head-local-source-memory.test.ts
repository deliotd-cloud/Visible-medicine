import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openHeadPackageFromLocalSource} from '../lib/head-local-source.ts';

const origin='http://127.0.0.1:3000';
const hash=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const image=Uint8Array.from({length:262144},(_,i)=>i%251);
const mask=new Uint8Array([1,0]);
const entry={id:'test',label:'Fixture',family:'test',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.9},mask:{file:'mask.bin',sha256:hash(mask),dtype:'uint8',shape_kji:[1,1,2],offset_kji:[0,0,0],native_shape_kji:[1,256,256],ijk_to_ras:affine}};
const entries=(n:number)=>Array.from({length:n},(_,i)=>({...entry,id:`test.${i}`}));
const imageSpec={file:'image.bin',sha256:hash(image),dtype:'float32',shape_kji:[1,256,256],ijk_to_ras:affine};
const manifest=JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageSpec,entries:entries(355)},MRI:{image:imageSpec,entries:entries(117)}}});
const headers={'x-visible-medicine-local':'1'};
function chunked(chunks:Uint8Array[],extraHeaders:Record<string,string>={}){
  return new Response(new ReadableStream<Uint8Array>({start(controller){for(const chunk of chunks)controller.enqueue(chunk);controller.close();}}),{headers:{...headers,...extraHeaders}});
}
function fetcher(asset:()=>Response):typeof fetch{
  return (async(input:RequestInfo|URL,init?:RequestInit)=>{
    assert.equal(init?.redirect,'error');
    assert.equal(init?.credentials,'same-origin');
    assert.equal(new Headers(init?.headers).get('X-Visible-Medicine-Local'),'1');
    return String(input).includes('/manifest.json')?new Response(manifest,{headers}):asset();
  }) as typeof fetch;
}
async function assetFrom(asset:()=>Response,parentSignal?:AbortSignal){
  const pkg=await openHeadPackageFromLocalSource(fetcher(asset),origin,hash(manifest),parentSignal);
  assert.ok(pkg);
  const file=pkg.files.get('image.bin');assert.ok(file);
  return file;
}
function trackedResponse(chunks:Uint8Array[],extraHeaders:Record<string,string>={}){
  const state={bodyCancels:0,readerCancels:0,releases:0,reads:0};
  const reader={
    async read(){const value=chunks[state.reads++];return value?{done:false,value}:{done:true,value:undefined};},
    async cancel(){state.readerCancels++;},
    releaseLock(){state.releases++;},
  };
  const body={getReader(){return reader;},async cancel(){state.bodyCancels++;}};
  return {response:{ok:true,headers:new Headers({...headers,...extraHeaders}),body} as unknown as Response,state};
}
function responseWhenRead(stream:ReadableStream<Uint8Array>,started:()=>void):Response{
  return {ok:true,headers:new Headers(headers),body:{getReader(){
    const reader=stream.getReader();
    return {
      read(){const pending=reader.read();started();return pending;},
      cancel:()=>reader.cancel(),
      releaseLock:()=>reader.releaseLock(),
    };
  }}} as unknown as Response;
}

test('known-size asset streams into one destination, including nonzero-offset chunks',async()=>{
  const backing=new Uint8Array(image.length+14);backing.set(image,7);
  const asset=await assetFrom(()=>chunked([backing.subarray(7,100007),backing.subarray(100007,7+image.length)]));
  const NativeUint8Array=globalThis.Uint8Array;
  let fullAllocations=0;
  globalThis.Uint8Array=new Proxy(NativeUint8Array,{construct(target,args,newTarget){
    if(args[0]===image.length)fullAllocations++;
    return Reflect.construct(target,args,newTarget);
  }}) as Uint8ArrayConstructor;
  let result:ArrayBuffer;
  try{result=await asset.arrayBuffer();}finally{globalThis.Uint8Array=NativeUint8Array;}
  assert.equal(fullAllocations,1,'the actual asset reader allocates only one full-size destination');
  assert.equal(result.byteLength,image.length);
  assert.deepEqual(new Uint8Array(result),image);
});

test('the previous chunk is copied before the next read can reuse its backing storage',async()=>{
  const halfway=image.length/2;
  const reused=Uint8Array.from(image.subarray(0,halfway));
  let reads=0;
  const reader={
    async read(){
      if(++reads===1)return {done:false,value:reused};
      if(reads===2){reused.fill(255);return {done:false,value:image.subarray(halfway)};}
      return {done:true,value:undefined};
    },
    async cancel(){assert.fail('valid stream must not be cancelled');},
    releaseLock(){},
  };
  const response={ok:true,headers:new Headers(headers),body:{getReader(){return reader;}}} as unknown as Response;
  const asset=await assetFrom(()=>response);
  const result=new Uint8Array(await asset.arrayBuffer());
  assert.equal(reads,3);
  assert.equal(Buffer.compare(result,image),0,'the earlier bytes must survive producer buffer reuse');
});

test('exact Content-Length is accepted with byte-exact output',async()=>{
  const asset=await assetFrom(()=>chunked([image.subarray(0,100000),image.subarray(100000)],{'content-length':String(image.length)}));
  assert.deepEqual(new Uint8Array(await asset.arrayBuffer()),image);
});

test('known-size reader refuses malformed, oversized, short, and late body data',async()=>{
  const cases:[string,()=>Response][]=[
    ['malformed length',()=>chunked([image],{'content-length':'wat'})],
    ['oversized length',()=>chunked([image],{'content-length':String(image.length+1)})],
    ['short length',()=>chunked([image],{'content-length':String(image.length-1)})],
    ['unsafe length',()=>chunked([image],{'content-length':'9007199254740993'})],
    ['short body',()=>chunked([image.subarray(0,-1)])],
    ['oversized first chunk',()=>chunked([new Uint8Array(image.length+1)])],
    ['late extra chunk',()=>chunked([image,new Uint8Array([7])])],
  ];
  for(const [label,respond] of cases){
    const asset=await assetFrom(respond);
    await assert.rejects(asset.arrayBuffer(),/missing or too large/,label);
  }
});

test('invalid headers cancel the body; truncated and oversized bodies cancel and unlock their reader',async()=>{
  for(const length of ['wat',String(image.length+1),String(image.length-1),'9007199254740993']){
    const tracked=trackedResponse([image],{'content-length':length});
    const asset=await assetFrom(()=>tracked.response);
    await assert.rejects(asset.arrayBuffer(),/missing or too large/);
    assert.equal(tracked.state.bodyCancels,1,`header ${length} must cancel without obtaining a reader`);
    assert.equal(tracked.state.reads,0);
  }
  for(const chunks of [[image.subarray(0,-1)],[new Uint8Array(image.length+1)],[image,new Uint8Array([7])]]){
    const tracked=trackedResponse(chunks);
    const asset=await assetFrom(()=>tracked.response);
    await assert.rejects(asset.arrayBuffer(),/missing or too large/);
    assert.equal(tracked.state.readerCancels,1);
    assert.equal(tracked.state.releases,1);
  }
});

test('stream error is sanitized and cancelled reader releases its lock',async()=>{
  let pulls=0;
  const stream=new ReadableStream<Uint8Array>({
    pull(controller){
      if(++pulls===1)controller.enqueue(image);
      else controller.error(new Error('private transport detail'));
    },
  });
  const asset=await assetFrom(()=>new Response(stream,{headers}));
  await assert.rejects(asset.arrayBuffer(),/local head source could not be read/);
  // A stream already errored by the producer need not invoke cancel again.
  assert.equal(stream.locked,false);
});

test('abort during asset read cancels and unlocks the stream',async()=>{
  let started!:()=>void;const startedPromise=new Promise<void>(resolve=>{started=resolve;});
  let cancelled=false;
  const stream=new ReadableStream<Uint8Array>({
    pull(){return new Promise<void>(()=>{});},
    cancel(){cancelled=true;},
  });
  // Streams can prefetch before a consumer exists. Wait for the actual reader's
  // read, not producer pull, so this exercises abort during an active read.
  const asset=await assetFrom(()=>responseWhenRead(stream,started));
  const controller=new AbortController();
  const pending=asset.arrayBuffer(controller.signal);
  await startedPromise;controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
  assert.equal(cancelled,true);
  assert.equal(stream.locked,false);
});

test('aborting the parent package cancels and unlocks an active asset read',async()=>{
  let started!:()=>void;const startedPromise=new Promise<void>(resolve=>{started=resolve;});
  let cancelled=false;
  const stream=new ReadableStream<Uint8Array>({
    pull(){return new Promise<void>(()=>{});},
    cancel(){cancelled=true;},
  });
  const parent=new AbortController();
  const asset=await assetFrom(()=>responseWhenRead(stream,started),parent.signal);
  const pending=asset.arrayBuffer();
  await startedPromise;parent.abort();
  await assert.rejects(pending,{name:'AbortError'});
  assert.equal(cancelled,true);
  assert.equal(stream.locked,false);
});
