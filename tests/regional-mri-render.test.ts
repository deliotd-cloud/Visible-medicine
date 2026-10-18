import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {flattenKJI,type Plane} from '../lib/head-atlas-geometry.mjs';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMriFrame,regionalMriFocusSlice} from '../lib/regional-mri-render.ts';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
async function fixture(kind:'mask'|'derived'|'points'|'curve'='mask',float=false,points?:number[][],oblique=false){
  const values=Array.from({length:24},(_,i)=>i),image=float?new Uint8Array(Float32Array.from(values).buffer):Uint8Array.from(values),mask=kind==='derived'?new Uint8Array([1]):new Uint8Array([1,0]);
  const grid={shape_kji:[2,3,4],ijk_to_ras:oblique?
    [[Math.sqrt(3)/2,-1,0,11],[.5,Math.sqrt(3),0,23],[0,0,3,37],[0,0,0,1]]:
    [[1,0,0,0],[0,2,0,0],[0,0,3,0],[0,0,0,1]]};
  const geometry=kind==='points'||kind==='curve'?{kind,points_ras_mm:kind==='points'?(points??[[1,2,3]]):[[0,2,3],[1,2,3],[2,2,3]]}:
    {kind:'mask' as const,file:'mask.raw',sha256:sha(mask),shape_kji:kind==='derived'?[1,1,1]:[1,1,2],offset_kji:kind==='derived'?[2,2,2]:[1,1,1],
      grid:kind==='derived'?{shape_kji:[4,6,8],ijk_to_ras:[[.5,0,0,0],[0,1,0,0],[0,0,1.5,0],[0,0,0,1]]}:grid,
      gridKind:kind==='derived'?'derived-source-ras' as const:'source-native' as const,mappingRevision:'b'.repeat(64)};
  const annotation={id:'annotation',anatomyId:'test:source-anatomy',label:'Synthetic geometry',seriesId:'a',sourceImageSha256:sha(image),laterality:'left' as const,
    coverage:'partial' as const,review:{status:'accepted-scoped' as const,revision:'a'.repeat(64),scope:'Synthetic raster scope'},geometry};
  const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'a',label:'A',image:{...grid,file:'a.raw',dtype:float?'float32':'uint8',sha256:sha(image)},annotations:[annotation]},
      {id:'b',label:'B',image:{shape_kji:[3,2,4],ijk_to_ras:[[0,0,2,10],[1,0,0,20],[0,3,0,30],[0,0,0,1]],file:'b.raw',dtype:float?'float32':'uint8',sha256:sha(image)},annotations:[]}]};
  const encoded=JSON.stringify(manifest),bytes=new TextEncoder().encode(encoded).buffer;
  const asset=(b:Uint8Array):RegionalAsset=>({size:b.byteLength,arrayBuffer:async()=>b.slice().buffer});
  const files=new Map([['a.raw',asset(image)],['b.raw',asset(image)],...(kind==='points'||kind==='curve'?[]:[['mask.raw',asset(mask)] as [string,RegionalAsset]])]);
  const pkg=await openRegionalMriPackage(bytes,files,sha(encoded)),study=await loadRegionalMriSeries(pkg,'a');
  const overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
  return{pkg,study,overlay,originalImage:image,originalMask:mask};
}
const window={center:11.5,width:23,opacity:.7};
test('saved focus remains visible in every native plane, including an oblique source mask',async()=>{
  for(const [kind,oblique] of [['mask',false],['derived',false],['points',false],['curve',false],['mask',true]] as const){
    const f=await fixture(kind,false,undefined,oblique),beforeImage=sha(f.originalImage),beforeMask=sha(f.originalMask);
    const beforeStudy=sha(new Uint8Array(f.study.data.buffer));
    for(const plane of ['axial','coronal','sagittal'] as const){
      const slice=regionalMriFocusSlice(f.study,f.overlay,plane);
      assert.notEqual(slice,null,`${kind} has a source-owned focus in ${plane}`);
      const frame=regionalMriFrame(f.study,f.overlay,plane,slice!,window);
      assert(frame.maskPixels>0||frame.markers.length>0||frame.segments.length>0,
        `${kind} remains visible at its exact saved ${plane} focus`);
      if(oblique)assert.equal(frame.oblique,true,'native oblique sampling is not reoriented into another grid');
    }
    assert.equal(sha(f.originalImage),beforeImage);assert.equal(sha(f.originalMask),beforeMask);
    assert.equal(sha(new Uint8Array(f.study.data.buffer)),beforeStudy,'display navigation never modifies source scalar data');
  }
});
test('all native planes/slices match exact KJI voxels, direction labels and physical aspect',async()=>{
  const f=await fixture();
  for(const plane of ['axial','coronal','sagittal'] as const){const view=f.study.geometry.views[plane];
    for(let slice=0;slice<view.sliceCount;slice++){
      const frame=regionalMriFrame(f.study,null,plane,slice,window);
      assert.equal(frame.width,view.width);assert.equal(frame.height,view.height);assert.equal(frame.sampled,false);
      assert.equal(frame.displayAspect,view.width*view.pixelSpacing[0]/(view.height*view.pixelSpacing[1]));
      for(const label of ['left','right','top','bottom'] as const)assert.equal(frame.labels[label],view.directionLabels[label]);
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
        const index=flattenKJI(view.pixelToIJK(x,y,slice),f.study.series.image.shape_kji),grey=new Uint8ClampedArray([f.study.data[index]*255/23])[0];
        assert.deepEqual([...frame.pixels.slice((y*frame.width+x)*4,(y*frame.width+x)*4+4)],[grey,grey,grey,255]);
      }
    }
  }
});
test('native and derived masks paint only source-owned occupied pixels without mutating arrays',async()=>{
  for(const kind of ['mask','derived'] as const){const f=await fixture(kind),before=[...f.study.data];
    const frame=regionalMriFrame(f.study,f.overlay,'axial',1,window),index=(1*frame.width+2)*4;
    assert.equal(frame.maskPixels,1);assert.notEqual(frame.pixels[index],frame.pixels[index+1]);
    assert.equal(regionalMriFrame(f.study,f.overlay,'axial',0,window).maskPixels,0);
    f.overlay.mask!.fill(0);assert.equal(regionalMriFrame(f.study,f.overlay,'axial',1,window).maskPixels,1);
    assert.deepEqual([...f.study.data],before);assert.deepEqual([...f.originalImage],Array.from({length:24},(_,i)=>i));
    assert.deepEqual(regionalMriFocusSlice(f.study,f.overlay,'axial'),1);
  }
});
test('points and curves are drawn only in their native slice slab, without inferred cross-plane links',async()=>{
  const p=await fixture('points'),c=await fixture('curve');
  assert.equal(regionalMriFrame(p.study,p.overlay,'axial',1,window).markers.length,1);
  assert.equal(regionalMriFrame(p.study,p.overlay,'axial',0,window).markers.length,0);
  assert.equal(regionalMriFrame(c.study,c.overlay,'axial',1,window).segments.length,2);
  assert.equal(regionalMriFrame(c.study,c.overlay,'axial',0,window).segments.length,0);
  assert.equal(regionalMriFrame(p.study,p.overlay,'axial',1,window).maskPixels,0);
});
test('bounded raster explicitly reports sampling while preserving native dimensions and physical aspect',async()=>{
  const f=await fixture(),frame=regionalMriFrame(f.study,null,'axial',1,window,2);
  assert.equal(frame.sampled,true);assert.equal(frame.width,2);assert.equal(frame.height,2);
  assert.equal(frame.nativeWidth,4);assert.equal(frame.nativeHeight,3);assert.equal(frame.displayAspect,2/3);
  for(const options of [{...window,width:0},{...window,center:NaN},{...window,opacity:2}])assert.throws(()=>regionalMriFrame(f.study,null,'axial',1,options));
  for(const size of [0,1.5,2049])assert.throws(()=>regionalMriFrame(f.study,null,'axial',1,window,size));
});
test('foreign annotations, invalid planes/slices and nonfinite modified display data are refused',async()=>{
  const f=await fixture(),b=await loadRegionalMriSeries(f.pkg,'b');
  assert.throws(()=>regionalMriFrame(b,f.overlay,'axial',0,window),/different source/);
  assert.throws(()=>regionalMriFocusSlice(b,f.overlay,'axial'),/different source/);
  for(const slice of [-1,.5,2])assert.throws(()=>regionalMriFrame(f.study,null,'axial',slice,window),/Invalid native/);
  assert.throws(()=>regionalMriFrame(f.study,null,'invalid' as Plane,0,window),/Invalid native/);
  const real=await fixture('mask',true);real.study.data[0]=NaN;
  assert.throws(()=>regionalMriFrame(real.study,null,'axial',0,window),/no longer finite/);
});
test('forged markup overlays, focus and cloned study cannot bypass loader ownership',async()=>{
  for(const kind of ['points','curve'] as const){const f=await fixture(kind),forged={...f.overlay,focus:[0,0,0]};
    assert.throws(()=>regionalMriFrame(f.study,forged,'axial',1,window),/owned|verified/);
    assert.throws(()=>regionalMriFocusSlice(f.study,forged,'axial'),/owned|verified/);
    assert.throws(()=>regionalMriFrame({...f.study},null,'axial',1,window),/owned|verified/);
  }
});

test('native focus tolerates only numerical voxel-edge roundtrip error, not truly out-of-source geometry',async()=>{
 const edge=await fixture('points',false,[[-1e-10,4+1e-10,3]]);
 const expected={axial:1,coronal:2,sagittal:0};
 for(const plane of ['axial','coronal','sagittal'] as const){
  assert.equal(regionalMriFocusSlice(edge.study,edge.overlay,plane),expected[plane]);
  assert.equal(regionalMriFrame(edge.study,edge.overlay,plane,expected[plane],window).markers.length,1);
 }
 for(const point of [[-.01,4,3],[0,4.01,3],[0,4,3.01]]){
  const outside=await fixture('points',false,[point]);
  for(const plane of ['axial','coronal','sagittal'] as const)assert.equal(regionalMriFocusSlice(outside.study,outside.overlay,plane),null);
 }
});
