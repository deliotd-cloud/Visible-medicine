import type {HeadEntry,Modality} from './head-atlas-import';
import {headConceptById,headConceptFromAtlasQuery,HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {resolveHeadImageConcept,headImageConceptById} from './head-image-only-links.ts';
import {headCerebellarLearningSequences} from './head-cerebellar-learning.ts';
import {HEAD_TEACHING_REVISION} from './head-atlas-teaching.ts';
import {headMriLearningSequences} from './head-mri-learning.ts';
import {headInsulaLearningSequences} from './head-insula-learning.ts';
import {headOrbitalLearningSequences} from './head-orbital-learning.ts';
import {headCtBoneLearningSequences} from './head-ct-bone-learning.ts';
import {headCtFacialLearningSequences} from './head-ct-facial-learning.ts';
// Published URL positions are stable: changing an existing order requires a new sequence ID.
export const headLearningSequences=[
  {id:'brainstem',label:'Brainstem orientation',concepts:['brainstem-midbrain','brainstem-pons','brainstem-medulla']},
  {id:'ventricles',label:'Ventricular spaces',concepts:['ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth']},
  {id:'deep-grey',label:'Paired deep grey structures',concepts:['deep-left-caudate','deep-right-caudate','deep-left-putamen','deep-right-putamen','deep-left-globus-pallidus','deep-right-globus-pallidus','deep-left-thalamus','deep-right-thalamus']},
  {id:'cerebral-lobes',label:'Cerebral lobes',concepts:['cortex-left-frontal-lobe','cortex-right-frontal-lobe','cortex-left-parietal-lobe','cortex-right-parietal-lobe','cortex-left-temporal-lobe','cortex-right-temporal-lobe','cortex-left-occipital-lobe','cortex-right-occipital-lobe']},
  {id:'hippocampi',label:'Paired hippocampi',concepts:['limbic-left-hippocampus','limbic-right-hippocampus']},
];

/** Keep existing review packets unchanged; extension sequences have separate identities. */
export function headLearningSequencesForModality(modality?:Modality){
  return [...headLearningSequences,...(modality==='CT'?[]:headMriLearningSequences),...headInsulaLearningSequences,...headOrbitalLearningSequences,...(modality==='MRI'?[]:headCtBoneLearningSequences),...headCerebellarLearningSequences,...(modality==='MRI'?[]:headCtFacialLearningSequences)];
}

/** Read-only review identity, not clinical approval or a patient-space transform. */
export const HEAD_LEARNING_REVISION='47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052';
export function headLearningPacket(){
  return {schema:'vm-head-learning-sequences-1',headRevision:HEAD_LINK_REVISION,teachingRevision:HEAD_TEACHING_REVISION,
    status:'draft',patientRegistration:false,clinicalApproval:false,publicationApproval:false,
    scope:'Anatomical concepts across separate, unregistered subjects. Regional extents may differ. No functional maps, measured flow, subfield boundaries or diagnostic assessment are established. No scores, progress or approvals are recorded by sequence navigation.',
    sequences:headLearningSequences.map(sequence=>({...sequence,concepts:[...sequence.concepts],bindings:sequence.concepts.map(headConceptById)}))};
}
export function headLearningEntries(entries:HeadEntry[],sequenceId:string,modality:Modality,revision:string):HeadEntry[]{
  return headLearningSteps(entries,sequenceId,modality,revision).flatMap(step=>step.entry?[step.entry]:[]);
}

/** Preserve canonical slots: absent anatomy must not renumber or silently skip a step. */
export function headLearningSteps(entries:HeadEntry[],sequenceId:string,modality:Modality,revision:string):Array<{conceptId:string;index:number;label:string;entry:HeadEntry|null}>{
  if(revision!==HEAD_LINK_REVISION)return [];
  return (headLearningSequencesForModality(modality).find(sequence=>sequence.id===sequenceId)?.concepts??[]).map((conceptId,index)=>{
    const match=resolveHeadImageConcept(entries,conceptId,modality);
    return {conceptId,index,label:headImageConceptById(conceptId)!.label,entry:entries.find(candidate=>candidate===match)??null};
  });
}

export type HeadLearningPosition={sequenceId:string;conceptId:string|null};
type LearningQuery=URLSearchParams|Record<string,string|string[]|undefined>;
const handoffKeys=['headTour','headStep','headRevision'] as const;
export function hasHeadLearningQuery(query:LearningQuery):boolean{
  return handoffKeys.some(key=>query instanceof URLSearchParams?query.has(key):Object.hasOwn(query,key));
}
/** URL metadata only: no file handles, scan identifiers, quiz answers or scores. */
export function parseHeadLearningIntent(query:LearningQuery,surface:'image'|'atlas'='image'):HeadLearningPosition|null{
  const allowed=new Set<string>(['concept',...handoffKeys,...(surface==='atlas'?['study','structure','side','source','focus','detail','part','partSource']:[])]);
  const keys=query instanceof URLSearchParams?query.keys():Object.keys(query);
  for(const key of keys)if(!allowed.has(key))return null;
  const value=(key:string)=>{
    const item=query instanceof URLSearchParams?query.getAll(key):query[key];
    if(Array.isArray(item))return query instanceof URLSearchParams&&item.length===1?item[0]:null;
    return typeof item==='string'?item:null;
  };
  const sequence=headLearningSequencesForModality().find(item=>item.id===value('headTour'));
  const step=value('headStep'),concept=value('concept');
  if(!sequence||value('headRevision')!==HEAD_LINK_REVISION||!step||!/^(0|[1-9]\d?)$/.test(step)||sequence.concepts[Number(step)]!==concept)return null;
  if(surface==='atlas'&&headConceptFromAtlasQuery(query)?.conceptId!==concept)return null;
  return {sequenceId:sequence.id,conceptId:concept};
}
/** Construct only allowlisted first-party destinations; never relay arbitrary query fields. */
export function headLearningLinks(position:HeadLearningPosition){
  const sequence=headLearningSequencesForModality().find(item=>item.id===position.sequenceId);
  const index=position.conceptId?sequence?.concepts.indexOf(position.conceptId):-1;
  const concept=position.conceptId?headImageConceptById(position.conceptId):null;
  if(!sequence||index===undefined||index<0||!concept)return null;
  function append(href:string|undefined){
    if(!href)return undefined;
    const [path,search]=href.split('?'),query=new URLSearchParams(search);
    query.set('headTour',sequence!.id);query.set('headStep',String(index));query.set('headRevision',HEAD_LINK_REVISION);
    return `${path}?${query}`;
  }
  return {atlasHref:append(concept.atlasHref),ctHref:append(concept.ctHref),mriHref:append(concept.mriHref)};
}

/** Wrapper-owned sequence navigation; it never follows live selections inside the iframe. */
export function headLearningNavigation(position:HeadLearningPosition,modality?:Modality){
  const sequence=headLearningSequencesForModality().find(item=>item.id===position.sequenceId);
  const index=position.conceptId?sequence?.concepts.indexOf(position.conceptId):-1;
  const current=headLearningLinks(position),concept=position.conceptId?headImageConceptById(position.conceptId):null;
  if(!sequence||index===undefined||index<0||!current||!concept)return null;
  const destination=(links:typeof current)=>modality==='CT'?links.ctHref:modality==='MRI'?links.mriHref:links.atlasHref;
  const exitHref=modality==='CT'?concept.ctHref:modality==='MRI'?concept.mriHref:concept.atlasHref;
  if(!destination(current)||!exitHref)return null;
  function adjacent(offset:number){
    const id=sequence!.concepts[index!+offset],target=id?headImageConceptById(id):null;
    const links=id?headLearningLinks({sequenceId:sequence!.id,conceptId:id}):null;
    const href=links?destination(links):null;
    return target&&href?{label:target.label,href}:null;
  }
  return {sequenceLabel:sequence.label,index,total:sequence.concepts.length,label:concept.label,current,previous:adjacent(-1),next:adjacent(1),exitHref};
}
