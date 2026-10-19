import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation} from '../lib/regional-mri-package.ts';
import {regionalMriFrame,regionalMriMaskAtFramePixel} from '../lib/regional-mri-render.ts';

const sha=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
const asset=(v:Uint8Array)=>({size:v.byteLength,async arrayBuffer(){return v.slice().buffer;}});
async function fixture(mode:'native'|'cropped'|'derived'|'points'|'provisional'|'empty'='native',orientation='identity'){
  const image=Uint8Array.from({length:24},(_,i)=>i),mask=new Uint8Array(mode==='derived'?192:mode==='cropped'?12:24);
  if(mode!=='empty'){mask[mode==='derived'?96:mode==='cropped'?0:12]=1;mask[mode==='derived'?134:mode==='cropped'?11:23]=1;}
  const matrix=orientation==='oblique'?[[.883,-.469,0,0],[.469,.883,0,0],[0,0,2,0],[0,0,0,1]]:
    orientation==='permuted'?[[0,-2,0,0],[1,0,0,0],[0,0,3,0],[0,0,0,1]]:[[1,0,0,0],[0,2,0,0],[0,0,3,0],[0,0,0,1]];
  const grid={shape_kji:[2,3,4],ijk_to_ras:matrix};
  const derivedGrid={shape_kji:[4,6,8],ijk_to_ras:matrix.map((row,i)=>row.map((v,j)=>j<3?v/2:v))};
  const representation=mode==='points'?{kind:'points',points_ras_mm:[[0,0,3]]}:
    {kind:'mask',file:'mask.raw',sha256:sha(mask),shape_kji:mode==='derived'?[4,6,8]:mode==='cropped'?[1,3,4]:[2,3,4],offset_kji:mode==='cropped'?[1,0,0]:[0,0,0],
      grid:mode==='derived'?derivedGrid:grid,gridKind:mode==='derived'?'derived-source-ras':'source-native',mappingRevision:'b'.repeat(64)};
  const annotation={id:'a',anatomyId:'concept:a',label:'Target',seriesId:'s',sourceImageSha256:sha(image),laterality:'left',coverage:'partial',
    review:{status:mode==='provisional'?'provisional':'accepted-scoped',revision:'a'.repeat(64),scope:'Synthetic'},geometry:representation};
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'s',label:'S',image:{...grid,file:'image.raw',dtype:'uint8',sha256:sha(image)},annotations:[annotation]}]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest));
  const files=new Map([['image.raw',asset(image)],...(mode==='points'?[]:[['mask.raw',asset(mask)] as [string,ReturnType<typeof asset>]])]);
  const pkg=await openRegionalMriPackage(bytes.buffer,files,sha(bytes));
  const study=await loadRegionalMriSeries(pkg,'s');
  const overlay=await loadRegionalMriAnnotation(pkg,study,study.series.annotations[0],undefined,mode==='provisional'?{inspectProvisional:true}:undefined);
  return {study,overlay};
}
const window={center:11.5,width:23,opacity:.7};
const hit=(frame:any,study:any,overlay:any,plane:any,slice:number,x:number,y:number)=>regionalMriMaskAtFramePixel(frame,study,overlay,plane,slice,x,y);

test('native, permuted and oblique pixels match the renderer tint in every plane',async()=>{
  for(const orientation of ['identity','permuted','oblique']){
    const {study,overlay}=await fixture('native',orientation);
    for(const plane of ['axial','coronal','sagittal'] as const)for(let slice=0;slice<study.geometry.views[plane].sliceCount;slice++){
      const frame=regionalMriFrame(study,overlay,plane,slice,window),grey=regionalMriFrame(study,null,plane,slice,window);
      let occupied=0;
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
        const n=(y*frame.width+x)*4,painted=frame.pixels[n]!==grey.pixels[n]||frame.pixels[n+1]!==grey.pixels[n+1]||frame.pixels[n+2]!==grey.pixels[n+2];
        if(frame.maskPixels)assert.equal(hit(frame,study,overlay,plane,slice,x,y),painted?'inside':'outside');if(painted)occupied++;
      }
      if(occupied===0)assert.equal(hit(frame,study,overlay,plane,slice,0,0),'unavailable');
      assert.equal(frame.maskPixels,occupied);
    }
  }
});

test('derived/cropped and downsampled rasters retain exact displayed membership, including opacity zero',async()=>{
  for(const mode of ['cropped','derived'] as const){
    const {study,overlay}=await fixture(mode);
    for(const maxDimension of [2,1024]){
      const frame=regionalMriFrame(study,overlay,'axial',1,window,maxDimension);
      const grey=regionalMriFrame(study,null,'axial',1,window,maxDimension);
      const hidden=regionalMriFrame(study,overlay,'axial',1,{...window,opacity:0},maxDimension);
      assert.deepEqual(hidden.pixels,grey.pixels);
      let inside=0;
      for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
        const n=(y*frame.width+x)*4,painted=frame.pixels[n]!==grey.pixels[n]||frame.pixels[n+1]!==grey.pixels[n+1]||frame.pixels[n+2]!==grey.pixels[n+2];
        assert.equal(hit(frame,study,overlay,'axial',1,x,y),painted?'inside':'outside');
        assert.equal(hit(hidden,study,overlay,'axial',1,x,y),painted?'inside':'outside');
        if(painted)inside++;
      }
      assert(inside>0);
      assert.equal(hit(frame,study,overlay,'axial',1,-1,0),'unavailable');
      assert.equal(hit(frame,study,overlay,'axial',1,frame.width,0),'unavailable');
      assert.equal(hit(frame,study,overlay,'axial',0,0,0),'unavailable');
      assert.equal(hit(frame,study,overlay,'coronal',1,0,0),'unavailable');
    }
  }
});

test('copies, metadata edits, other sources, zero masks and non-mask overlays are unavailable',async()=>{
  const f=await fixture(),frame=regionalMriFrame(f.study,f.overlay,'axial',1,window),other=await fixture();
  assert.equal(hit({...frame},f.study,f.overlay,'axial',1,0,0),'unavailable');
  assert.equal(hit(structuredClone(frame),f.study,f.overlay,'axial',1,0,0),'unavailable');
  assert.equal(hit(frame,other.study,f.overlay,'axial',1,0,0),'unavailable');
  assert.equal(hit(frame,f.study,other.overlay,'axial',1,0,0),'unavailable');
  assert.equal(hit(frame,f.study,f.overlay,'axial',1,.5,0),'unavailable');
  frame.maskPixels++;
  assert.equal(hit(frame,f.study,f.overlay,'axial',1,0,0),'unavailable');
  for(const field of ['markers','segments'] as const){
    const changed=regionalMriFrame(f.study,f.overlay,'axial',1,window);
    if(field==='markers')changed.markers.push({x:0,y:0});
    else changed.segments.push([{x:0,y:0},{x:1,y:1}]);
    assert.equal(hit(changed,f.study,f.overlay,'axial',1,0,0),'unavailable',field);
  }
  for(const mode of ['empty','provisional','points'] as const){
    const {study,overlay}=await fixture(mode),nonProof=regionalMriFrame(study,overlay,'axial',1,window);
    assert.equal(hit(nonProof,study,overlay,'axial',1,0,0),'unavailable');
  }
});
