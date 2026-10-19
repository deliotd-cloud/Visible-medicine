import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {nearestHeadMaskSlice} from '../lib/head-slice-viewport.ts';

test('nearest saved mask slice respects actual occupancy, all native planes and source bytes',()=>{
 for(const affine of [
  [[-2,0,0,20],[0,1,0,-5],[0,0,3,2],[0,0,0,1]],
  [[1.8,-.4,0,20],[.4,1.8,0,-5],[0,0,3,2],[0,0,0,1]],
  [[0,0,-2,20],[3,0,0,-5],[0,-1,0,2],[0,0,0,1]],
 ]){
  const geometry=createNativeVolumeGeometry({shape_kji:[20,24,28],ijk_to_ras:affine});
  const crop={offset_kji:[4,5,6],shape_kji:[10,12,14]},mask=new Uint8Array(1680),points=[[7,6,5],[14,13,12]];
  for(const [i,j,k] of points)mask[((k-4)*12+j-5)*14+i-6]=1;
  const before=mask.slice();
  for(const view of Object.values(geometry.views))for(let slice=0;slice<view.sliceCount;slice++){
   const candidates=points.map(p=>p[view.fixedAxisIJK]).sort((a,b)=>Math.abs(a-slice)-Math.abs(b-slice)||a-b);
   assert.equal(nearestHeadMaskSlice(view,slice,crop,mask),candidates[0]);
  }
  assert.deepEqual(mask,before);
 }
});

test('empty, nonbinary, malformed and out-of-volume masks cannot invent a destination',()=>{
 const g=createNativeVolumeGeometry({shape_kji:[9,9,9],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]});
 const crop={offset_kji:[1,1,1],shape_kji:[7,7,7]},mask=new Uint8Array(343);
 for(const view of Object.values(g.views)){
  assert.equal(nearestHeadMaskSlice(view,4,crop,mask),null);
  mask.fill(2);assert.equal(nearestHeadMaskSlice(view,4,crop,mask),null);mask.fill(1);
  for(const slice of [-1,.5,9,NaN])assert.equal(nearestHeadMaskSlice(view,slice,crop,mask),null);
  for(const offset of [undefined,[1,1],[-1,0,0],[0,.5,0],[0,0,NaN],[8,8,8]])assert.equal(nearestHeadMaskSlice(view,4,{...crop,offset_kji:offset},mask),null);
  for(const shape of [[7,7],[0,7,7],[7.5,7,7],[7,7,NaN]])assert.equal(nearestHeadMaskSlice(view,4,{...crop,shape_kji:shape},mask),null);
  assert.equal(nearestHeadMaskSlice(view,4,crop,new Uint8Array(1)),null);mask.fill(0);
 }
});

test('equal-distance alternatives choose the lower native index even when encountered later',()=>{
 const g=createNativeVolumeGeometry({shape_kji:[9,9,9],ijk_to_ras:[[-1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]});
 const crop={offset_kji:[0,0,0],shape_kji:[9,9,9]},mask=new Uint8Array(729);
 mask[(1*9+1)*9+7]=1;mask[(7*9+7)*9+1]=1;
 for(const view of Object.values(g.views))assert.equal(nearestHeadMaskSlice(view,4,crop,mask),1);
});
