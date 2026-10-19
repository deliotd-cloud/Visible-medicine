import {maskCropIndexForIJK, type Vec3, type NativeGeometry} from './head-atlas-geometry.mjs';
import type {HeadEntry, LoadedEntry, LoadedStudy} from './head-atlas-import';
import {headLabel} from './head-atlas-display.ts';

export type PracticeMode = 'locate'|'label'|'recall';
export type PracticeOutcome = 'correct'|'incorrect'|'revealed';
export type HeadPracticeReviewItem = {entry:HeadEntry;outcome:PracticeOutcome|'unanswered'};

/** Session review is tied to exact eligible objects in the current study, never matching names/IDs. */
export function practiceReviewEntries(deck:HeadEntry[],outcomes:Record<string,PracticeOutcome>,entries:HeadEntry[]):HeadPracticeReviewItem[]{
  const eligible=new Set(practiceEntries(entries)),seen=new Set<HeadEntry>();
  return deck.flatMap(entry=>{
    if(!eligible.has(entry)||seen.has(entry))return [];
    seen.add(entry);
    const outcome=Object.hasOwn(outcomes,entry.id)?outcomes[entry.id]:'unanswered';
    return outcome==='correct'||outcome==='incorrect'||outcome==='revealed'||outcome==='unanswered'?[{entry,outcome}]:[];
  });
}

/** A follow-up uses only missed/revealed/unanswered exact current-study objects. */
export function practiceRevisitEntries(deck:HeadEntry[],outcomes:Record<string,PracticeOutcome>,entries:HeadEntry[]):HeadEntry[]{
  return practiceReviewEntries(deck,outcomes,entries).filter(item=>item.outcome!=='correct').map(item=>item.entry);
}

/** Equal crop bytes do not imply equal anatomy: bind them to their native placement.
 * File names are transport details; renamed copies of the same placed mask remain duplicates.
 * Package validation and loaded-mask scoring remain separate, fail-closed gates.
 */
function maskPlacementKey(entry:HeadEntry):string|null {
  const mask=entry.mask;
  if(!mask?.sha256)return null;
  return JSON.stringify([mask.sha256,mask.dtype,mask.shape_kji,mask.offset_kji,mask.native_shape_kji,mask.ijk_to_ras]);
}

/** Only real saved masks can define a scored region. Aliases are not distinct boundaries. */
export function practiceEntries(entries:HeadEntry[], family='All systems'):HeadEntry[] {
  const seen=new Set<string>();
  return entries.filter(entry=>{
    const placement=maskPlacementKey(entry);
    if(!placement||entry.source?.geometry_alias_of!=null||seen.has(placement))return false;
    // Reserve the whole-study representative before applying a system filter,
    // so started questions, completed review and revisits share one identity.
    seen.add(placement);return family==='All systems'||entry.family===family;
  });
}

export function shuffled<T>(items:T[], random:()=>number=Math.random):T[] {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

/** Genuine same-study labels, preferentially from the same system; IDs, never array indices, score answers. */
export function practiceChoices(entries:HeadEntry[], target:HeadEntry, random:()=>number=Math.random):HeadEntry[] {
  const seenLabels=new Set([headLabel(target)]);
  const targetPlacement=maskPlacementKey(target);
  const candidates=practiceEntries(entries).filter(entry=>{
    const label=headLabel(entry);
    if(entry.id===target.id||maskPlacementKey(entry)===targetPlacement||seenLabels.has(label))return false;
    seenLabels.add(label);return true;
  });
  const peers=shuffled(candidates.filter(entry=>entry.family===target.family),random);
  const others=shuffled(candidates.filter(entry=>entry.family!==target.family),random);
  return shuffled([target,...peers,...others].slice(0,4),random);
}

export function labelIsCorrect(target:HeadEntry, choiceId:string, choices:HeadEntry[]):boolean {
  return !!choiceId&&choices.some(entry=>entry.id===choiceId)&&choiceId===target.id;
}

/** Exact displayed-name recall, not synonym or fuzzy matching. Keep every word,
 * side and number; normalize only case, spacing and punctuation boundaries. */
export function normalizePracticeLabel(value:string):string {
  return value.normalize('NFC').toLowerCase().replace(/\p{P}+/gu,' ').replace(/\s+/gu,' ').trim();
}

export function typedLabelIsCorrect(target:HeadEntry,value:string):boolean {
  if(value.length>200)return false;
  const answer=normalizePracticeLabel(value);
  return !!answer&&answer===normalizePracticeLabel(headLabel(target));
}

/** Fail closed outside the exact active study/crop. No tolerance, dilation or locator substitute. */
export function maskContainsVoxel(target:LoadedEntry, study:LoadedStudy, point:Vec3):boolean {
  const crop=target.entry.mask,mask=target.mask,shape=study.geometry.shapeKJI;
  if(!study.definition.entries.includes(target.entry)||!mask||!crop||!crop.offset_kji||crop.dtype!=='uint8'||point.some((v,i)=>!Number.isSafeInteger(v)||v<0||v>=shape[2-i]))return false;
  if(JSON.stringify(crop.native_shape_kji)!==JSON.stringify(study.definition.image.shape_kji)||JSON.stringify(crop.ijk_to_ras)!==JSON.stringify(study.definition.image.ijk_to_ras)||mask.length!==crop.shape_kji.reduce((a,b)=>a*b,1))return false;
  if(crop.offset_kji.some((v,i)=>!Number.isSafeInteger(v)||v<0||v+crop.shape_kji[i]>shape[i]))return false;
  try{const index=maskCropIndexForIJK(point,{offset_kji:crop.offset_kji,shape_kji:crop.shape_kji});return index!==null&&mask[index]===1;}catch{return false;}
}

/** Native canvas pixels cover equal half-open CSS rectangles, even with anisotropic spacing. */
export function canvasVoxel(view:NativeGeometry['views']['axial'], rect:{left:number;top:number;width:number;height:number}, x:number, y:number, slice:number):Vec3|null {
  if(![rect.left,rect.top,rect.width,rect.height,x,y,slice].every(Number.isFinite)||rect.width<=0||rect.height<=0||x<rect.left||y<rect.top||x>=rect.left+rect.width||y>=rect.top+rect.height)return null;
  try{return view.pixelToIJK(Math.floor((x-rect.left)*view.width/rect.width),Math.floor((y-rect.top)*view.height/rect.height),slice);}catch{return null;}
}

export function practiceScore(outcomes:Record<string,PracticeOutcome>, total:number) {
  const values=Object.values(outcomes);
  return {correct:values.filter(value=>value==='correct').length,attempted:values.filter(value=>value!=='revealed').length,revealed:values.filter(value=>value==='revealed').length,remaining:Math.max(0,total-values.length),total};
}

export function firstPracticeOutcome(previous:Record<string,PracticeOutcome>, id:string, value:PracticeOutcome):Record<string,PracticeOutcome> {
  return Object.hasOwn(previous,id)?previous:{...previous,[id]:value};
}
