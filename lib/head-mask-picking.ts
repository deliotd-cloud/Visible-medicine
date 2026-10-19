import type {Vec3} from './head-atlas-geometry.mjs';
import type {HeadEntry,LoadedEntry,LoadedStudy} from './head-atlas-import';
import {maskContainsVoxel} from './head-atlas-practice.ts';

const visibleAlpha=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1;

/** Collect every visible saved-mask hit at one exact native voxel; do not decide which anatomy the learner meant. */
export function headMaskHits(study:LoadedStudy,layers:readonly LoadedEntry[],point:Vec3,opacity:number,layerOpacity:Record<string,number>):LoadedEntry[]{
  if(!visibleAlpha(opacity))return [];
  const hits:LoadedEntry[]=[],seen=new Set<HeadEntry>();
  for(const layer of layers){
    const entry=layer?.entry;
    if(!entry||seen.has(entry)||!study.definition.entries.includes(entry))continue;
    const local=Object.hasOwn(layerOpacity,entry.id)?layerOpacity[entry.id]:1;
    if(!visibleAlpha(local)||!entry.opacity||!(visibleAlpha(entry.opacity.fill)||visibleAlpha(entry.opacity.outline)))continue;
    if(!(layer.mask instanceof Uint8Array))continue;
    // Reject nonintersecting crops before checking binary integrity of a candidate buffer.
    try{if(maskContainsVoxel(layer,study,point)&&!layer.mask.some(value=>value!==0&&value!==1)){hits.push(layer);seen.add(entry);}}catch{/* malformed metadata cannot create a hit */}
  }
  return hits;
}
