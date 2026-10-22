import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HEAD_SURFACE_CHUNK_SCALARS,validateHeadSurface} from '../lib/head-surface-validation.ts';

test('small valid surfaces accept boundary coordinates without a timer turn',async()=>{
  const positions=Float32Array.from([-100000,0,100000,1,2,3]);
  const indices=Uint16Array.from([0,1,0]);
  let timerRan=false;
  const timer=setTimeout(()=>{timerRan=true;},0);
  try{
    await validateHeadSurface(positions,indices,2);
    assert.equal(timerRan,false);
    assert.equal(positions[0],-100000);
    assert.equal(indices[1],1);
  }finally{clearTimeout(timer);}
});

test('position and index refusals include late chunks and original error messages',async()=>{
  for(const bad of [NaN,Infinity,-Infinity,100001,-100001]){
    const positions=new Float32Array(HEAD_SURFACE_CHUNK_SCALARS+1);
    positions[positions.length-1]=bad;
    await assert.rejects(validateHeadSurface(positions,Uint16Array.of(0),1),/Invalid world-space surface point\./);
  }
  const indices=new Uint32Array(HEAD_SURFACE_CHUNK_SCALARS+1);
  indices[indices.length-1]=1;
  await assert.rejects(validateHeadSurface(Float32Array.of(0,0,0),indices,1),/Surface index is out of bounds\./);
  await assert.rejects(validateHeadSurface(Float32Array.of(NaN,0,0),Uint16Array.of(1),1),/Invalid world-space surface point\./);
  await assert.rejects(validateHeadSurface(Float32Array.of(0,0,0),Uint16Array.of(1),1),/Surface index is out of bounds\./);
});

test('a queued timer aborts during large valid positions and indices separately',async()=>{
  const positions=new Float32Array(HEAD_SURFACE_CHUNK_SCALARS*3+1);
  const indices=new Uint32Array(HEAD_SURFACE_CHUNK_SCALARS*3+1);
  for(const phase of ['positions','indices'] as const){
    const controller=new AbortController();let timerRan=false;
    const timer=setTimeout(()=>{timerRan=true;controller.abort();},0);
    try{
      const currentPositions=phase==='positions'?positions:Float32Array.of(0,0,0);
      await assert.rejects(validateHeadSurface(currentPositions,indices,1,controller.signal),{name:'AbortError'});
      assert.equal(timerRan,true);
    }finally{clearTimeout(timer);}
  }
  const pre=new AbortController();pre.abort();
  await assert.rejects(validateHeadSurface(Float32Array.of(0,0,0),Uint16Array.of(0),1,pre.signal),{name:'AbortError'});
});
