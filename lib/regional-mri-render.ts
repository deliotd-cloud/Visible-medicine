import {flattenKJI,type Plane} from './head-atlas-geometry.mjs';
import {assertRegionalMriOwnership,regionalMaskAtImageIJK,type RegionalLoadedSeries,type RegionalLoadedAnnotation} from './regional-mri-package.ts';

export type RegionalMriFrame={width:number;height:number;nativeWidth:number;nativeHeight:number;displayAspect:number;
  sampled:boolean;oblique:boolean;pixels:Uint8ClampedArray;maskPixels:number;
  labels:{left:string;right:string;top:string;bottom:string};
  markers:Array<{x:number;y:number}>;segments:Array<[{x:number;y:number},{x:number;y:number}]>};
export type RegionalMriWindow={center:number;width:number;opacity:number};
const fail=(message:string):never=>{throw new Error(message);};
type FrameMaskProof={study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;plane:Plane;slice:number;
  width:number;height:number;nativeWidth:number;nativeHeight:number;displayAspect:number;sampled:boolean;oblique:boolean;
  maskPixels:number;pixels:Uint8ClampedArray;labels:RegionalMriFrame['labels'];labelValues:readonly string[];
  markers:RegionalMriFrame['markers'];segments:RegionalMriFrame['segments'];occupied:Uint8Array};
const frameMasks=new WeakMap<RegionalMriFrame,FrameMaskProof>();

/** Display raster only: no source voxels, masks or cross-sequence transforms are changed. */
export function regionalMriFrame(study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation|null,plane:Plane,slice:number,
  window:RegionalMriWindow,maxDimension=1024):RegionalMriFrame{
  assertRegionalMriOwnership(study,overlay);
  const view=study.geometry.views[plane];
  if(!view||!Number.isSafeInteger(slice)||slice<0||slice>=view.sliceCount)throw new Error('Invalid native view or slice.');
  if(!Number.isFinite(window.center)||!Number.isFinite(window.width)||window.width<=0||!Number.isFinite(window.opacity)||window.opacity<0||window.opacity>1||
    !Number.isSafeInteger(maxDimension)||maxDimension<1||maxDimension>2048)throw new Error('Invalid display window or raster limit.');
  if(overlay&&!study.series.annotations.includes(overlay.annotation))throw new Error('Selected geometry belongs to a different source sequence.');
  const scale=Math.min(1,maxDimension/Math.max(view.width,view.height)),width=Math.max(1,Math.round(view.width*scale)),height=Math.max(1,Math.round(view.height*scale));
  const pixels=new Uint8ClampedArray(width*height*4),occupied=new Uint8Array(width*height);
  const first=view.pixelToIJK(0,0,slice),stepX=view.width>1?view.pixelToIJK(1,0,slice).map((n,i)=>n-first[i]):[0,0,0];
  const stepY=view.height>1?view.pixelToIJK(0,1,slice).map((n,i)=>n-first[i]):[0,0,0];
  flattenKJI(first,study.series.image.shape_kji);flattenKJI(view.pixelToIJK(view.width-1,view.height-1,slice),study.series.image.shape_kji);
  const [,J,I]=study.series.image.shape_kji;
  const low=window.center-window.width/2;let maskPixels=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const nx=width===1?Math.floor(view.width/2):Math.round(x*(view.width-1)/(width-1));
    const ny=height===1?Math.floor(view.height/2):Math.round(y*(view.height-1)/(height-1));
    const ijk=first.map((n,i)=>n+stepX[i]*nx+stepY[i]*ny),value=study.data[(ijk[2]*J+ijk[1])*I+ijk[0]];
    if(!Number.isFinite(value))throw new Error('Display data is no longer finite. Reload the verified source.');
    const grey=Math.max(0,Math.min(255,(value-low)*255/window.width)),n=(y*width+x)*4;
    pixels[n]=grey;pixels[n+1]=grey;pixels[n+2]=grey;pixels[n+3]=255;
    if(overlay?.annotation.geometry.kind==='mask'&&regionalMaskAtImageIJK(study,overlay,ijk as [number,number,number])===1){occupied[y*width+x]=1;maskPixels++;}
  }
  if(maskPixels&&window.opacity)for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(occupied[y*width+x]){
    const edge=x===0||y===0||x===width-1||y===height-1||!occupied[y*width+x-1]||!occupied[y*width+x+1]||!occupied[(y-1)*width+x]||!occupied[(y+1)*width+x];
    const strength=window.opacity*(edge?1:.35),n=(y*width+x)*4;
    for(const[c,color]of [54,199,185].entries())pixels[n+c]=pixels[n+c]*(1-strength)+color*strength;
  }
  const markers:Array<{x:number;y:number}>=[],segments:RegionalMriFrame['segments']=[];
  const representation=overlay?.annotation.geometry;
  if(representation?.kind==='points'||representation?.kind==='curve'){
    const project=(point:number[])=>{
      const ijk=study.geometry.rasToIjk(point),dims=[study.series.image.shape_kji[2],study.series.image.shape_kji[1],study.series.image.shape_kji[0]];
      if(ijk.some((n,i)=>!Number.isFinite(n)||n<-.000001||n>dims[i]-1+.000001)||Math.abs(ijk[view.fixedAxisIJK]-slice)>.5)return null;
      const p=view.pixelFromIJK(ijk.map(Math.round));return{x:(p.x+.5)*width/view.width,y:(p.y+.5)*height/view.height};
    };
    let previous:{x:number;y:number}|null=null;
    for(const point of representation.points_ras_mm){const p=project(point);if(p){markers.push(p);if(representation.kind==='curve'&&previous)segments.push([previous,p]);}previous=p;}
  }
  const {left,right,top,bottom}=view.directionLabels;
  const frame:RegionalMriFrame={width,height,nativeWidth:view.width,nativeHeight:view.height,displayAspect:view.width*view.pixelSpacing[0]/(view.height*view.pixelSpacing[1]),
    sampled:width!==view.width||height!==view.height,oblique:view.oblique,pixels,maskPixels,labels:{left,right,top,bottom},markers,segments};
  if(overlay?.annotation.geometry.kind==='mask'&&overlay.purpose==='scoped-display'&&overlay.annotation.review.status==='accepted-scoped'&&maskPixels>0)
    frameMasks.set(frame,{study,overlay,plane,slice,width:frame.width,height:frame.height,nativeWidth:frame.nativeWidth,nativeHeight:frame.nativeHeight,
      displayAspect:frame.displayAspect,sampled:frame.sampled,oblique:frame.oblique,maskPixels:frame.maskPixels,pixels:frame.pixels,
      labels:frame.labels,labelValues:[frame.labels.left,frame.labels.right,frame.labels.top,frame.labels.bottom],markers:frame.markers,segments:frame.segments,occupied});
  return frame;
}

/** Returns only display-raster membership from an exact, loader-owned frame. */
export function regionalMriMaskAtFramePixel(frame:RegionalMriFrame,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,
  plane:Plane,slice:number,x:number,y:number):'inside'|'outside'|'unavailable'{
  const saved=frameMasks.get(frame);
  if(!saved||saved.study!==study||saved.overlay!==overlay||saved.plane!==plane||saved.slice!==slice||
    !Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0||x>=saved.width||y>=saved.height||
    frame.width!==saved.width||frame.height!==saved.height||frame.nativeWidth!==saved.nativeWidth||frame.nativeHeight!==saved.nativeHeight||
    frame.displayAspect!==saved.displayAspect||frame.sampled!==saved.sampled||frame.oblique!==saved.oblique||
    frame.maskPixels!==saved.maskPixels||frame.pixels!==saved.pixels||frame.labels!==saved.labels||
    frame.labels.left!==saved.labelValues[0]||frame.labels.right!==saved.labelValues[1]||
    frame.labels.top!==saved.labelValues[2]||frame.labels.bottom!==saved.labelValues[3]||
    frame.markers!==saved.markers||frame.segments!==saved.segments||frame.markers.length!==0||frame.segments.length!==0||
    overlay.purpose!=='scoped-display'||overlay.annotation.review.status!=='accepted-scoped'||overlay.annotation.geometry.kind!=='mask')return 'unavailable';
  try{assertRegionalMriOwnership(study,overlay);}catch{return 'unavailable';}
  return saved.occupied[y*saved.width+x]?'inside':'outside';
}

/** Explicit jump to saved geometry focus, not a new landmark or cross-sequence cursor. */
export function regionalMriFocusSlice(study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,plane:Plane):number|null{
  assertRegionalMriOwnership(study,overlay);
  if(!study.series.annotations.includes(overlay.annotation))fail('Selected geometry belongs to a different source sequence.');
  if(!overlay.focus)return null;const ijk=study.geometry.rasToIjk(overlay.focus);
  const dims=[study.series.image.shape_kji[2],study.series.image.shape_kji[1],study.series.image.shape_kji[0]];
  // Match native markup projection tolerance: matrix roundtrips can put a valid
  // boundary voxel a few floating-point units outside zero. Never clamp a real
  // out-of-source landmark or change its saved geometry.
  if(ijk.some((n,i)=>!Number.isFinite(n)||n<-.000001||n>dims[i]-1+.000001))return null;
  const axis=study.geometry.views[plane].fixedAxisIJK;
  return Math.round(Math.max(0,Math.min(dims[axis]-1,ijk[axis])));
}
