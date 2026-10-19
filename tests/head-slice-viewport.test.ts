import assert from 'node:assert/strict';
import test from 'node:test';
import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';
import {canvasVoxel} from '../lib/head-atlas-practice.ts';
import {headSliceViewport, zoomHeadSliceViewport, fitHeadMaskViewport} from '../lib/head-slice-viewport.ts';

test('saved-mask focus frames occupied voxels, not the crop box, in mirrored anisotropic and oblique native views',()=>{
  for(const affine of [
    [[-2,0,0,20],[0,1,0,-5],[0,0,3,2],[0,0,0,1]],
    [[1.8,-.4,0,20],[.4,1.8,0,-5],[0,0,3,2],[0,0,0,1]],
  ]){
    const geometry=createNativeVolumeGeometry({shape_kji:[20,24,28],ijk_to_ras:affine});
    const crop={offset_kji:[4,5,6],shape_kji:[10,12,14]},mask=new Uint8Array(1680),point=[12,10,8];
    mask[((point[2]-4)*12+point[1]-5)*14+point[0]-6]=1;
    const before=mask.slice(),fit={width:480,height:320};
    for(const view of Object.values(geometry.views)){
      const slice=point[view.fixedAxisIJK],result=fitHeadMaskViewport(fit,view,slice,crop,mask);assert(result);
      assert.equal(result.zoom,4,'a one-voxel target reaches bounded zoom even in a large crop');
      const viewport=headSliceViewport(fit,{width:view.width*view.pixelSpacing[0],height:view.height*view.pixelSpacing[1]},result.zoom,result.pan);
      const pixel=view.pixelFromIJK(point),x=viewport.left+(pixel.x+.5)*viewport.width/view.width,y=viewport.top+(pixel.y+.5)*viewport.height/view.height;
      assert(x>=0&&x<fit.width&&y>=0&&y<fit.height,'target stays in the viewport');
      for(const [screen,extent,pan,image] of [[x,fit.width,viewport.panX,viewport.width],[y,fit.height,viewport.panY,viewport.height]]){
        if(Math.abs(screen-extent/2)>1e-9)assert.equal(Math.abs(pan),Math.max(0,(image-extent)/2),'off-centre only when the existing no-blank-edge pan limit is reached');
      }
      assert.deepEqual(canvasVoxel(view,viewport,x,y,slice),point);
      assert.equal(fitHeadMaskViewport(fit,view,slice+1,crop,mask),null,'empty slice is not an inferred extent');
      assert.equal(fitHeadMaskViewport(fit,view,0,crop,mask),null,'outside crop does not jump slices');
    }
    assert.deepEqual(mask,before,'source mask bytes remain unchanged');
  }
});

test('saved-mask focus respects occupied extent, image-edge bounds and malformed input refusal',()=>{
  const geometry=createNativeVolumeGeometry({shape_kji:[3,10,10],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]});
  const view=geometry.views.axial,fit={width:200,height:200},crop={offset_kji:[0,0,0],shape_kji:[3,10,10]},mask=new Uint8Array(300).fill(1);
  assert.deepEqual(fitHeadMaskViewport(fit,view,1,crop,mask),{zoom:1,pan:{x:0,y:0}},'whole image is not zoomed past its bounds');
  mask.fill(0);mask[100]=1;
  const result=fitHeadMaskViewport(fit,view,1,crop,mask);assert(result);assert.equal(result.zoom,4);
  const viewport=headSliceViewport(fit,{width:10,height:10},result.zoom,result.pan);
  assert(viewport.left<=0&&viewport.top<=0&&viewport.left+viewport.width>=200&&viewport.top+viewport.height>=200);
  for(const invalid of [undefined,[0,0],[-1,0,0],[0,.5,0],[0,0,NaN]])assert.equal(fitHeadMaskViewport(fit,view,1,{...crop,offset_kji:invalid},mask),null);
  for(const slice of [-1,.5,3,NaN])assert.equal(fitHeadMaskViewport(fit,view,slice,crop,mask),null);
  assert.equal(fitHeadMaskViewport(fit,view,1,crop,new Uint8Array(1)),null);
  assert.equal(fitHeadMaskViewport({width:0,height:200},view,1,crop,mask),null);
});

test('aspect fitting uses physical spacing and centers each unfilled axis at 1x', () => {
  const viewport = headSliceViewport({width: 400, height: 300}, {width: 200, height: 100}, 1, {x: 99, y: -99});
  assert.deepEqual(viewport, {zoom: 1, panX: 0, panY: 0, width: 400, height: 200, left: 0, top: 50});
  const tall = headSliceViewport({width: 400, height: 300}, {width: 100, height: 200}, 1, {x: 40, y: 40});
  assert.deepEqual(tall, {zoom: 1, panX: 0, panY: 0, width: 150, height: 300, left: 125, top: 0});
});

test('pan is bounded independently by each oversized axis without exposing blank edge', () => {
  const viewport = headSliceViewport({width: 400, height: 300}, {width: 200, height: 100}, 2, {x: 1000, y: -1000});
  assert.deepEqual(viewport, {zoom: 2, panX: 200, panY: -50, width: 800, height: 400, left: 0, top: -100});
  const underfilledY = headSliceViewport({width: 400, height: 300}, {width: 200, height: 100}, 1.25, {x: -1000, y: 1000});
  assert.equal(underfilledY.panX, -50);
  assert.equal(underfilledY.panY, 0);
  assert.equal(underfilledY.left + underfilledY.width, 400);
  assert.equal(underfilledY.top, 25);
});

test('invalid inputs normalize and zoom keeps the centered image point stable', () => {
  assert.deepEqual(headSliceViewport({width: NaN, height: 0}, {width: Infinity, height: -3}, NaN, {x: Infinity, y: NaN}),
    {zoom: 1, panX: 0, panY: 0, width: 1, height: 1, left: 0, top: 0});
  assert.equal(headSliceViewport({width: 10, height: 10}, {width: 10, height: 10}, 99, {x: 0, y: 0}).zoom, 4);
  const current = headSliceViewport({width: 400, height: 300}, {width: 200, height: 100}, 2, {x: 75, y: -25});
  const next = zoomHeadSliceViewport(current, 3);
  assert.deepEqual(next, {zoom: 3, pan: {x: 112.5, y: -37.5}});
  const after = headSliceViewport({width: 400, height: 300}, {width: 200, height: 100}, next.zoom, next.pan);
  assert.equal(current.panX / current.zoom, after.panX / after.zoom);
  assert.equal(current.panY / current.zoom, after.panY / after.zoom);
  assert.deepEqual(zoomHeadSliceViewport(current, Infinity), {zoom: 1, pan: {x: 37.5, y: -12.5}});
});

test('zoomed and panned CSS rectangles invert to exact native voxels in all three planes', () => {
  const geometry = createNativeVolumeGeometry({shape_kji: [4, 6, 8], ijk_to_ras: [[-2, 0, 0, 20], [0, 1, 0, -5], [0, 0, 3, 2], [0, 0, 0, 1]]});
  const fit = {width: 400, height: 300};
  for (const [plane, view] of Object.entries(geometry.views)) {
    const physical = {width: view.width * view.pixelSpacing[0], height: view.height * view.pixelSpacing[1]};
    const viewport = headSliceViewport(fit, physical, 2.5, {x: 45, y: -30});
    const rect = {left: 17 + viewport.left, top: 23 + viewport.top, width: viewport.width, height: viewport.height};
    for (const slice of [0, view.sliceCount - 1]) for (const [x, y] of [[0, 0], [view.width - 1, view.height - 1], [Math.floor(view.width / 2), Math.floor(view.height / 2)]]) {
      const screenX = rect.left + (x + .5) * rect.width / view.width;
      const screenY = rect.top + (y + .5) * rect.height / view.height;
      assert.deepEqual(canvasVoxel(view, rect, screenX, screenY, slice), view.pixelToIJK(x, y, slice), `${plane}: exact pixel identity`);
      assert.ok(screenX >= rect.left && screenX < rect.left + rect.width && screenY >= rect.top && screenY < rect.top + rect.height);
    }
    assert.equal(canvasVoxel(view, rect, rect.left - 0.01, rect.top, 0), null, `${plane}: outside left`);
    assert.equal(canvasVoxel(view, rect, rect.left + rect.width, rect.top, 0), null, `${plane}: right edge excluded`);
    assert.equal(canvasVoxel(view, rect, rect.left, rect.top + rect.height, 0), null, `${plane}: bottom edge excluded`);
  }
});
