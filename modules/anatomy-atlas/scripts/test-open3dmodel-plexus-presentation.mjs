import assert from 'node:assert/strict';
import test from 'node:test';
import {candidateCameraArc,candidateCameraProgress,candidateLabelPlacement} from './open3dmodel-plexus-presentation.mjs';

test('queued early RAF and interrupted transitions cannot create negative progress',()=>{
  for(const [now,start,expected] of [[999,1000,0],[1000,1000,0],[1375,1000,.5],[1750,1000,1],[2000,1000,1]]){
    const progress=candidateCameraProgress(now,start);assert.equal(progress,expected);
    assert(candidateCameraArc([0,0,10],[0,0,0],[0,0,0],[0,0,-1],10,progress).position.every(Number.isFinite));
  }
  assert.throws(()=>candidateCameraProgress(NaN,0));assert.throws(()=>candidateCameraProgress(0,0,0));
});

test('opposite axis presets follow a finite spherical arc around the target',()=>{
  const start=[0,0,10],target=[0,0,0];
  for(const t of [0,.1,.25,.5,.75,.9,1]){
    const pose=candidateCameraArc(start,target,target,[0,0,-1],10,t);
    assert(pose.position.every(Number.isFinite));
    assert(Math.abs(Math.hypot(...pose.position)-10)<1e-9);
    assert(pose.position.some(v=>Math.abs(v)>1e-6),'Camera crossed model centre');
  }
  assert.deepEqual(candidateCameraArc(start,target,target,[0,0,-1],10,1).position.map(v=>Math.round(v)),[0,0,-10]);
});

test('camera target and radius transition without crossing object centre',()=>{
  const pose=candidateCameraArc([0,0,10],[0,0,0],[5,2,0],[1,0,0],20,.5);
  assert(pose.position.every(Number.isFinite));
  assert.deepEqual(pose.target,[2.5,1,0]);
  assert(Math.abs(Math.hypot(...pose.position.map((v,i)=>v-pose.target[i]))-15)<1e-9);
});

test('label stays wholly on selected projected half across viewport widths',()=>{
  for(const width of [120,320,640,940,1280])for(const fraction of [.01,.25,.49,.5,.75,.99]){
    const x=width*fraction,p=candidateLabelPlacement(width,600,x,300,50,100);
    assert.equal(p.side,x<width/2?'left':'right');
    assert(p.left>=0 && p.left+p.actualWidth<=width);
    if(p.side==='left')assert(p.left+p.actualWidth<width/2);
    else assert(p.left>width/2);
    assert(p.top>=0 && p.top+50<=600);
    assert(p.edgeX>=0 && p.edgeX<=width);
  }
});
