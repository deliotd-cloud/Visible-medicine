import type {NativeView} from './head-atlas-geometry.mjs';

export type HeadSliceViewport = {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
  left: number;
  top: number;
};

const positive = (value: number) => Number.isFinite(value) && value > 0 ? value : 1;
const finite = (value: number) => Number.isFinite(value) ? value : 0;
const boundedZoom = (value: number) => Number.isFinite(value) ? Math.min(4, Math.max(1, value)) : 1;
const boundedPan = (value: number, imageSize: number, fitSize: number) => {
  const limit = Math.max(0, (imageSize - fitSize) / 2);
  if (limit === 0) return 0;
  return Math.min(limit, Math.max(-limit, finite(value)));
};

/** Image rectangle in CSS pixels, relative to the fitting area's top-left corner. */
export function headSliceViewport(
  fit: {width: number; height: number},
  physical: {width: number; height: number},
  zoom: number,
  pan: {x: number; y: number},
): HeadSliceViewport {
  const fitWidth = positive(fit.width), fitHeight = positive(fit.height);
  const physicalWidth = positive(physical.width), physicalHeight = positive(physical.height);
  const safeZoom = boundedZoom(zoom);
  const scale = Math.min(fitWidth / physicalWidth, fitHeight / physicalHeight);
  const width = physicalWidth * scale * safeZoom;
  const height = physicalHeight * scale * safeZoom;
  const panX = boundedPan(pan.x, width, fitWidth);
  const panY = boundedPan(pan.y, height, fitHeight);
  return {
    zoom: safeZoom,
    panX,
    panY,
    width,
    height,
    left: (fitWidth - width) / 2 + panX,
    top: (fitHeight - height) / 2 + panY,
  };
}

/** Preserve the image point at the fitting area's center when zoom changes. */
export function zoomHeadSliceViewport(
  current: HeadSliceViewport,
  nextZoom: number,
): {zoom: number; pan: {x: number; y: number}} {
  const zoom = boundedZoom(nextZoom);
  const currentZoom = boundedZoom(current.zoom);
  return {zoom, pan: {x: finite(current.panX) * zoom / currentZoom, y: finite(current.panY) * zoom / currentZoom}};
}

/** Closest occupied native slice; crop bounds alone never establish anatomy. */
export function nearestHeadMaskSlice(
  view:NativeView, slice:number,
  crop:{offset_kji?:readonly number[];shape_kji:readonly number[]}, mask:Uint8Array,
): number|null {
  const offset=crop.offset_kji,shape=crop.shape_kji;
  if(!offset||offset.length!==3||shape.length!==3||
    !offset.every(v=>Number.isSafeInteger(v)&&v>=0)||!shape.every(v=>Number.isSafeInteger(v)&&v>0)||
    mask.length!==shape.reduce((a,b)=>a*b,1)||!Number.isInteger(slice)||slice<0||slice>=view.sliceCount)return null;
  const start=[offset[2],offset[1],offset[0]],end=start.map((v,i)=>v+shape[2-i]-1),axis=view.fixedAxisIJK;
  if(start[axis]<0||end[axis]>=view.sliceCount)return null;
  for(const point of [start,end]){
    const pixel=view.pixelFromIJK(point);
    if(!Number.isInteger(pixel.x)||!Number.isInteger(pixel.y)||pixel.x<0||pixel.x>=view.width||pixel.y<0||pixel.y>=view.height)return null;
  }
  let nearest:number|null=null,distance=Infinity;
  // Lazy, allocation-free scan of the existing crop, only on explicit action.
  // A gap inside the crop is not occupied anatomy. Ties use the lower native index.
  for(let index=0;index<mask.length;index++){
    if(mask[index]!==1)continue;
    const local=axis===0?index%shape[2]:axis===1?Math.floor(index/shape[2])%shape[1]:Math.floor(index/(shape[1]*shape[2]));
    const candidate=start[axis]+local,delta=Math.abs(candidate-slice);
    if(delta<distance||delta===distance&&(nearest===null||candidate<nearest)){nearest=candidate;distance=delta;}
    if(distance===0)return slice;
  }
  return nearest;
}

/** Frame occupied saved-mask voxels on this native slice; no inferred extent or slice jump. */
export function fitHeadMaskViewport(
  fit: {width:number;height:number}, view:NativeView, slice:number,
  crop:{offset_kji?:readonly number[];shape_kji:readonly number[]}, mask:Uint8Array,
): {zoom:number;pan:{x:number;y:number}}|null {
  const offset=crop.offset_kji,shape=crop.shape_kji;
  if(!offset||offset.length!==3||shape.length!==3||
    !offset.every(v=>Number.isSafeInteger(v)&&v>=0)||!shape.every(v=>Number.isSafeInteger(v)&&v>0)||
    mask.length!==shape.reduce((a,b)=>a*b,1)||!Number.isInteger(slice)||slice<0||slice>=view.sliceCount||
    ![fit.width,fit.height,view.width,view.height,...view.pixelSpacing].every(v=>Number.isFinite(v)&&v>0))return null;
  const start=[offset[2],offset[1],offset[0]],end=start.map((v,i)=>v+shape[2-i]-1);
  if(slice<start[view.fixedAxisIJK]||slice>end[view.fixedAxisIJK])return null;
  const corners=[view.pixelFromIJK(start),view.pixelFromIJK(end)];
  const x0=Math.max(0,Math.ceil(Math.min(...corners.map(p=>p.x)))),x1=Math.min(view.width-1,Math.floor(Math.max(...corners.map(p=>p.x))));
  const y0=Math.max(0,Math.ceil(Math.min(...corners.map(p=>p.y)))),y1=Math.min(view.height-1,Math.floor(Math.max(...corners.map(p=>p.y))));
  let minX=Infinity,minY=Infinity,maxX=-1,maxY=-1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const ijk=view.pixelToIJK(x,y,slice),i=ijk[0]-start[0],j=ijk[1]-start[1],k=ijk[2]-start[2];
    if(i<0||i>=shape[2]||j<0||j>=shape[1]||k<0||k>=shape[0]||mask[(k*shape[1]+j)*shape[2]+i]!==1)continue;
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  if(maxX<0)return null;
  const physical={width:view.width*view.pixelSpacing[0],height:view.height*view.pixelSpacing[1]};
  const base=headSliceViewport(fit,physical,1,{x:0,y:0});
  // Leave a 10% margin on each side; retain the existing 1–4x limit.
  const zoom=boundedZoom(Math.min(fit.width*.8/((maxX-minX+1)*base.width/view.width),fit.height*.8/((maxY-minY+1)*base.height/view.height)));
  const pan={x:(.5-(minX+maxX+1)/(2*view.width))*base.width*zoom,y:(.5-(minY+maxY+1)/(2*view.height))*base.height*zoom};
  const framed=headSliceViewport(fit,physical,zoom,pan);
  return {zoom:framed.zoom,pan:{x:framed.panX,y:framed.panY}};
}
