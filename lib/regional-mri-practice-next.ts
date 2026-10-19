import {assertRegionalMriPackageOwnership,type RegionalAnnotation,type RegionalLoadedAnnotation,
  type RegionalLoadedSeries,type RegionalMriPackage} from './regional-mri-package.ts';
import {createRegionalMriLocationCheck,createRegionalMriStructureCheck} from './regional-mri-structure-check.ts';

const normalized=(value:string)=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');

/** Source metadata only. The caller must load and verify the first candidate before displaying it. */
export function regionalMriNextPracticeCandidates(pkg:RegionalMriPackage,study:RegionalLoadedSeries,
  overlay:RegionalLoadedAnnotation,mode:'name'|'locate'):readonly RegionalAnnotation[]{
  try{assertRegionalMriPackageOwnership(pkg,study,overlay);}catch{return Object.freeze([]);}
  if(mode!=='name'&&mode!=='locate')return Object.freeze([]);
  const annotations=study.series.annotations,current=overlay.annotation,index=annotations.indexOf(current);
  if(index<0||current.seriesId!==study.series.id||current.sourceImageSha256!==study.series.image.sha256||
    overlay.purpose!=='scoped-display')return Object.freeze([]);
  const validCurrent=mode==='name'?createRegionalMriStructureCheck(pkg,study,overlay):createRegionalMriLocationCheck(pkg,study,overlay);
  if(!validCurrent)return Object.freeze([]);

  const concepts=new Map<string,number>(),labels=new Map<string,Set<string>>();
  for(const annotation of annotations){
    const concept=normalized(annotation.anatomyId),label=normalized(annotation.label);
    concepts.set(concept,(concepts.get(concept)??0)+1);
    const associated=labels.get(label)??new Set<string>();associated.add(concept);labels.set(label,associated);
  }
  const currentConcept=normalized(current.anatomyId);
  const ordered=annotations.slice(index+1).concat(annotations.slice(0,index));
  return Object.freeze(ordered.filter(annotation=>{
    const concept=normalized(annotation.anatomyId),label=normalized(annotation.label);
    return concept!==currentConcept&&annotation.review.status==='accepted-scoped'&&
      annotation.seriesId===study.series.id&&annotation.sourceImageSha256===study.series.image.sha256&&
      annotation.geometry.kind!=='none'&&(mode==='name'||annotation.geometry.kind==='mask')&&
      concepts.get(concept)===1&&labels.get(label)?.size===1;
  }));
}
