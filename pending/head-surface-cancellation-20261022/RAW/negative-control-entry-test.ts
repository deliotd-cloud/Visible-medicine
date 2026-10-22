import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadHeadEntry,type HeadEntry,type HeadPackageAsset,type LoadedStudy,type LocalHeadPackage} from '../lib/head-atlas-import.ts';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {HEAD_SURFACE_CHUNK_SCALARS} from '../lib/head-surface-validation.ts';

const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function fixture(positions:Float32Array,indices:Uint32Array){
  const hash=(view:Float32Array|Uint32Array)=>createHash('sha256').update(new Uint8Array(view.buffer,view.byteOffset,view.byteLength)).digest('hex');
  const image={file:'unused.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:[1,1,1],ijk_to_ras:affine};
  const entry:HeadEntry={id:'synthetic',label:'Synthetic',family:'test',representation:'mesh',color:[1,1,1],opacity:{fill:1,outline:1},mesh:{positions_file:'positions.bin',indices_file:'indices.bin',positions_dtype:'float32',indices_dtype:'uint32',point_count:positions.length/3,triangle_count:indices.length/3,positions_sha256:hash(positions),indices_sha256:hash(indices)}};
  const asset=(view:Float32Array|Uint32Array):HeadPackageAsset=>({size:view.byteLength,async arrayBuffer(){return view.buffer as ArrayBuffer;}});
  const pkg={files:new Map<string,HeadPackageAsset>([['positions.bin',asset(positions)],['indices.bin',asset(indices)]])} as LocalHeadPackage;
  const study={definition:{image,entries:[entry]},data:new Uint8Array(1),geometry:createNativeVolumeGeometry(image),range:[0,1]} as LoadedStudy;
  return {pkg,study,entry};
}

test('actual loadHeadEntry retains the original verified typed buffers',async()=>{
  const positions=Float32Array.of(0,0,0,100000,-100000,1);
  const indices=Uint32Array.of(0,1,0);
  const {pkg,study,entry}=fixture(positions,indices);
  const loaded=await loadHeadEntry(pkg,study,entry);
  assert.equal(loaded.positions?.buffer,positions.buffer);
  assert.equal(loaded.indices?.buffer,indices.buffer);
  assert.deepEqual([...loaded.positions!],[...positions]);
});

test('actual loadHeadEntry refuses late invalid point and index without returning a result',async()=>{
  const positions=new Float32Array(HEAD_SURFACE_CHUNK_SCALARS*3+3);
  const indices=new Uint32Array(3);
  positions[positions.length-1]=NaN;
  let f=fixture(positions,indices);
  await assert.rejects(loadHeadEntry(f.pkg,f.study,f.entry),/Invalid world-space surface point\./);
  positions[positions.length-1]=0;
  indices[2]=positions.length/3;
  f=fixture(positions,indices);
  await assert.rejects(loadHeadEntry(f.pkg,f.study,f.entry),/Surface index is out of bounds\./);
});

test('a timer during actual entry surface validation rejects with no returned result',async()=>{
  const positions=new Float32Array(HEAD_SURFACE_CHUNK_SCALARS*3+3);
  const indices=new Uint32Array(3);
  const {pkg,study,entry}=fixture(positions,indices);
  const controller=new AbortController();
  const originalSetTimeout=globalThis.setTimeout;
  let validationYieldSeen=false,timerRan=false,returned=false;
  // Schedule cancellation on the validator's own first macrotask boundary, after
  // both authenticated asset reads have completed. Hashing has independent yields.
  globalThis.setTimeout=((callback:TimerHandler,delay?:number,...args:unknown[])=>{
    if(!validationYieldSeen&&new Error().stack?.includes('head-surface-validation.ts')){
      validationYieldSeen=true;
      originalSetTimeout(()=>{timerRan=true;controller.abort();},0);
    }
    return originalSetTimeout(callback,delay,...args);
  }) as typeof setTimeout;
  try{
    const pending=loadHeadEntry(pkg,study,entry,controller.signal).then(value=>{returned=true;return value;});
    await assert.rejects(pending,{name:'AbortError'});
    assert.equal(validationYieldSeen,true);
    assert.equal(timerRan,true);
    assert.equal(returned,false,'cancelled import has no returned surface or provenance');
  }finally{globalThis.setTimeout=originalSetTimeout;}
});
