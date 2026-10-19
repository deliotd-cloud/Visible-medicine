import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {sha256} from '@noble/hashes/sha2.js';
import {HEAD_ASSET_HASH_CHUNK_BYTES,sha256HeadAsset} from '../lib/head-asset-checksum.ts';
import {loadHeadStudy,openValidatedHeadPackage} from '../lib/head-atlas-import.ts';

const reference=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const chunk=HEAD_ASSET_HASH_CHUNK_BYTES;
const synthetic=(length:number)=>Uint8Array.from({length},(_,i)=>(Math.imul(i,73)+(i>>>9))&255);

test('NIST vectors and Node reference cover SHA-256 block and batch boundaries without modifying input',async()=>{
  assert.equal(await sha256HeadAsset(new ArrayBuffer(0)),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const abc=new TextEncoder().encode('abc');
  assert.equal(await sha256HeadAsset(abc.buffer),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  for(const length of [0,1,55,56,63,64,65,chunk-1,chunk,chunk+1,3*chunk+137]){
    const input=synthetic(length),original=input.slice();
    assert.equal(await sha256HeadAsset(input.buffer),reference(input),`length ${length}`);
    assert.deepEqual(input,original,`source changed at length ${length}`);
  }
});

test('updates are bounded zero-copy views and timer yields precede completion, including final batch',async()=>{
  const input=synthetic(2*chunk+17),hash=sha256.create();
  const updateOwner=Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(hash)));
  const originalUpdate=updateOwner.update;
  const originalDigest=updateOwner.digest;
  const originalTimer=globalThis.setTimeout;
  const views:Uint8Array[]=[],events:string[]=[];
  let completed=false,timerSawIncomplete=false;
  try{
    updateOwner.update=function(view:Uint8Array){views.push(view);events.push('update');return originalUpdate.call(this,view);};
    updateOwner.digest=function(){events.push('digest');return originalDigest.call(this);};
    globalThis.setTimeout=((callback:()=>void,delay?:number)=>{events.push('yield');return originalTimer(callback,delay);}) as typeof setTimeout;
    originalTimer(()=>{timerSawIncomplete=!completed;},0);
    assert.equal(await sha256HeadAsset(input.buffer),reference(input));
    completed=true;
  }finally{updateOwner.update=originalUpdate;updateOwner.digest=originalDigest;globalThis.setTimeout=originalTimer;hash.destroy();}
  assert.deepEqual(views.map(v=>v.byteLength),[chunk,chunk,17]);
  assert.ok(views.every(v=>v.buffer===input.buffer));
  assert.deepEqual(events,['update','yield','update','yield','update','yield','digest']);
  assert.equal(timerSawIncomplete,true,'an independently queued timer must run before the hash resolves');
});

test('pre-abort and cancellation after first or final yield never digest or return',async()=>{
  const pre=new AbortController();pre.abort();
  await assert.rejects(sha256HeadAsset(new ArrayBuffer(0),pre.signal),{name:'AbortError'});
  const hash=sha256.create(),digestOwner=Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(hash)));
  const destroyOwner=Object.getPrototypeOf(Object.getPrototypeOf(hash));
  const originalDigest=digestOwner.digest,originalTimer=globalThis.setTimeout;
  const originalDestroy=destroyOwner.destroy;
  let digests=0,destroyed=0;
  try{
    digestOwner.digest=function(){digests++;return originalDigest.call(this);};
    destroyOwner.destroy=function(){destroyed++;return originalDestroy.call(this);};
    for(const targetYield of [1,3]){
      const controller=new AbortController();let yields=0;
      globalThis.setTimeout=((callback:()=>void,delay?:number)=>{
        const yieldNumber=++yields;
        return originalTimer(()=>{if(yieldNumber===targetYield)controller.abort();callback();},delay);
      }) as typeof setTimeout;
      await assert.rejects(sha256HeadAsset(synthetic(2*chunk+1).buffer,controller.signal),{name:'AbortError'});
      assert.equal(yields,targetYield);
    }
  }finally{digestOwner.digest=originalDigest;destroyOwner.destroy=originalDestroy;globalThis.setTimeout=originalTimer;hash.destroy();}
  assert.equal(digests,0);
  assert.equal(destroyed,2,'each aborted hash must release its state');
});

test('hash state is destroyed on an update or timer error',async()=>{
  const hash=sha256.create(),updateOwner=Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(hash)));
  const destroyOwner=Object.getPrototypeOf(Object.getPrototypeOf(hash));
  const originalUpdate=updateOwner.update,originalDestroy=destroyOwner.destroy,originalTimer=globalThis.setTimeout;
  let destroyed=0;
  try{
    destroyOwner.destroy=function(){destroyed++;return originalDestroy.call(this);};
    updateOwner.update=function(){throw new Error('update failed');};
    await assert.rejects(sha256HeadAsset(new Uint8Array(1).buffer),/update failed/);
    updateOwner.update=originalUpdate;
    globalThis.setTimeout=(()=>{throw new Error('timer failed');}) as unknown as typeof setTimeout;
    await assert.rejects(sha256HeadAsset(new Uint8Array(chunk+1).buffer),/timer failed/);
  }finally{updateOwner.update=originalUpdate;destroyOwner.destroy=originalDestroy;globalThis.setTimeout=originalTimer;hash.destroy();}
  assert.equal(destroyed,2);
});

test('actual study asset loads without subtle.digest while manifest remains WebCrypto-bound',async()=>{
  const image=new Uint8Array([42]);
  const imageSpec={file:'image.bin',sha256:reference(image),dtype:'uint8',shape_kji:[1,1,1],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const entries=(count:number)=>Array.from({length:count},(_,i)=>({id:`synthetic.${i}`,label:'Synthetic',family:'test',representation:'point',color:[1,0,0],opacity:{fill:0.2,outline:0.9}}));
  const manifest=new TextEncoder().encode(JSON.stringify({schema_version:'visible-medicine.head-browser/1',version:'1.0.2',byte_order:'little',source_studies_are_distinct:true,studies:{CT:{image:imageSpec,entries:entries(355)},MRI:{image:imageSpec,entries:entries(117)}}}));
  let manifestDigests=0;
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{subtle:{digest:async(algorithm:string,bytes:ArrayBuffer)=>{
    if(bytes.byteLength!==manifest.byteLength)throw new Error('asset passed to subtle.digest');
    manifestDigests++;
    return webcrypto.subtle.digest(algorithm,bytes);
  }}}});
  try{
    const files=new Map([['image.bin',{size:1,arrayBuffer:async()=>image.buffer}]]);
    const pkg=await openValidatedHeadPackage(manifest.buffer,files,reference(manifest));
    const study=await loadHeadStudy(pkg,'CT');
    assert.equal(study.data[0],42);
    assert.equal(manifestDigests,1);
  }finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);else delete (globalThis as {crypto?:Crypto}).crypto;}
});
