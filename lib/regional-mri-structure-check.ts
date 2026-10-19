import {assertRegionalMriPackageOwnership,type RegionalMriPackage,type RegionalLoadedSeries,type RegionalLoadedAnnotation,type RegionalAnnotation} from './regional-mri-package.ts';
import {regionalMriFocusSlice,regionalMriMaskAtFramePixel,type RegionalMriFrame} from './regional-mri-render.ts';
import type {Plane} from './head-atlas-geometry.mjs';

export type RegionalMriStructureCheck=Readonly<{
  key:string;revision:string;prompt:string;options:readonly Readonly<{id:string;label:string}>[];
}>;

const REVISION='regional-mri-structure-check-20261014-v1';
const proofs=new WeakMap<RegionalMriStructureCheck,{pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;answer:string}>();
const normalized=(value:string)=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
const eligible=(annotation:RegionalAnnotation)=>annotation.review.status==='accepted-scoped'&&annotation.geometry.kind!=='none';
function context(pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):boolean{
  try{
    assertRegionalMriPackageOwnership(pkg,study,overlay);
    const annotation=overlay.annotation;
    return study.series.annotations.includes(annotation)&&annotation.seriesId===study.series.id&&
      annotation.sourceImageSha256===study.series.image.sha256&&overlay.purpose==='scoped-display'&&
      eligible(annotation)&&['axial','coronal','sagittal'].every(plane=>regionalMriFocusSlice(study,overlay,plane as 'axial'|'coronal'|'sagittal')!==null);
  }catch{return false;}
}
function seed(value:string):number{let n=2166136261;for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);return n>>>0;}

/** A question about one explicitly selected, verified native MRI annotation. */
export function createRegionalMriStructureCheck(pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):RegionalMriStructureCheck|null{
  if(!context(pkg,study,overlay))return null;
  const target=overlay.annotation,concept=normalized(target.anatomyId),label=normalized(target.label);
  if(study.series.annotations.some(candidate=>candidate!==target&&normalized(candidate.label)===label&&normalized(candidate.anatomyId)!==concept))return null;
  const candidates=study.series.annotations.filter(candidate=>candidate!==target&&eligible(candidate)&&
    candidate.seriesId===study.series.id&&candidate.sourceImageSha256===study.series.image.sha256&&
    normalized(candidate.anatomyId)!==concept&&normalized(candidate.label)!==label);
  candidates.sort((a,b)=>a.anatomyId.localeCompare(b.anatomyId)||a.id.localeCompare(b.id));
  const seenConcepts=new Set([concept]),seenLabels=new Set([label]),choices:RegionalAnnotation[]=[target];
  for(const candidate of candidates){
    const candidateConcept=normalized(candidate.anatomyId),candidateLabel=normalized(candidate.label);
    if(seenConcepts.has(candidateConcept)||seenLabels.has(candidateLabel))continue;
    choices.push(candidate);seenConcepts.add(candidateConcept);seenLabels.add(candidateLabel);
    if(choices.length===4)break;
  }
  if(choices.length<3)return null;
  const identity=`${pkg.revision}|${study.series.id}|${study.series.image.sha256}|${target.id}|${target.review.revision}`;
  const shift=seed(identity)%choices.length;
  const ordered=choices.slice(shift).concat(choices.slice(0,shift));
  const options=Object.freeze(ordered.map((candidate,index)=>Object.freeze({id:`choice-${index+1}`,label:candidate.label})));
  const check=Object.freeze({key:JSON.stringify([REVISION,pkg.revision,study.series.id,study.series.image.sha256,target.id,target.review.revision]),revision:REVISION,
    prompt:'Identify the saved highlighted annotation in this MRI sequence.',options});
  proofs.set(check,{pkg,study,overlay,answer:options[ordered.indexOf(target)].id});
  return check;
}

function proof(check:RegionalMriStructureCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation){
  const saved=proofs.get(check);
  return saved&&saved.pkg===pkg&&saved.study===study&&saved.overlay===overlay&&context(pkg,study,overlay)?saved:null;
}
export function gradeRegionalMriStructureCheck(check:RegionalMriStructureCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,optionId:string):'correct'|'incorrect'|'unavailable'{
  const saved=proof(check,pkg,study,overlay);
  if(!saved||!check.options.some(option=>option.id===optionId))return 'unavailable';
  return optionId===saved.answer?'correct':'incorrect';
}
export function revealRegionalMriStructureCheck(check:RegionalMriStructureCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):Readonly<{id:string;label:string}>|null{
  const saved=proof(check,pkg,study,overlay);
  return saved?check.options.find(option=>option.id===saved.answer)??null:null;
}

export type RegionalMriLocationCheck=Readonly<{key:string;revision:string;prompt:string;targetLabel:string}>;
const LOCATION_REVISION='regional-mri-location-check-20261014-v1';
const locationProofs=new WeakMap<RegionalMriLocationCheck,{pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation}>();
function locationContext(pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):boolean{
  if(!context(pkg,study,overlay)||overlay.annotation.geometry.kind!=='mask'||!overlay.mask||!overlay.mask.some(value=>value===1))return false;
  const target=overlay.annotation,concept=normalized(target.anatomyId),label=normalized(target.label);
  return !study.series.annotations.some(candidate=>candidate!==target&&normalized(candidate.label)===label&&normalized(candidate.anatomyId)!==concept);
}

/** One explicit saved extent in its own verified MRI sequence. */
export function createRegionalMriLocationCheck(pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):RegionalMriLocationCheck|null{
  if(!locationContext(pkg,study,overlay))return null;
  const target=overlay.annotation,geometry=target.geometry;
  if(geometry.kind!=='mask')return null;
  const check=Object.freeze({
    key:JSON.stringify([LOCATION_REVISION,pkg.revision,study.series.id,study.series.image.sha256,target.id,target.anatomyId,
      target.review.revision,geometry.sha256,geometry.mappingRevision]),
    revision:LOCATION_REVISION,prompt:'Locate the saved target extent in this MRI sequence.',targetLabel:target.label});
  locationProofs.set(check,{pkg,study,overlay});return check;
}
function locationProof(check:RegionalMriLocationCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation){
  const saved=locationProofs.get(check);
  return saved&&saved.pkg===pkg&&saved.study===study&&saved.overlay===overlay&&locationContext(pkg,study,overlay)?saved:null;
}
export function gradeRegionalMriLocationCheck(check:RegionalMriLocationCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,
  overlay:RegionalLoadedAnnotation,frame:RegionalMriFrame,plane:Plane,slice:number,x:number,y:number):'correct'|'incorrect'|'unavailable'{
  if(!locationProof(check,pkg,study,overlay))return 'unavailable';
  const hit=regionalMriMaskAtFramePixel(frame,study,overlay,plane,slice,x,y);
  return hit==='inside'?'correct':hit==='outside'?'incorrect':'unavailable';
}
export function revealRegionalMriLocationCheck(check:RegionalMriLocationCheck,pkg:RegionalMriPackage,study:RegionalLoadedSeries,
  overlay:RegionalLoadedAnnotation):string|null{
  return locationProof(check,pkg,study,overlay)?overlay.annotation.label:null;
}
