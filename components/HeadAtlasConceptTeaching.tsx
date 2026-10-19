'use client';
import {headTeachingForConcept} from '../lib/head-atlas-teaching';
import {headMriOnlyTeachingForConcept} from '../lib/head-mri-only-teaching';
import {headInsulaTeachingForConcept} from '../lib/head-insula-teaching';
import {headOrbitalTeachingForConcept} from '../lib/head-orbital-teaching';
import {headCtBoneTeachingForConcept} from '../lib/head-ct-bone-teaching';
import {headCtFacialTeachingForConcept} from '../lib/head-ct-facial-teaching.ts';
import {FACIAL_CONCEPTS,useVerifiedFacialTeaching} from './useVerifiedFacialTeaching';
import {headCerebellarTeachingForConcept} from '../lib/head-cerebellar-teaching';
import type {HeadModality} from '../lib/head-atlas-links';
import {HeadAnatomyCheck} from './HeadAnatomyCheck';

/** General source-bound facts for a canonical tour slot without a local mask. */
export function HeadAtlasConceptTeaching({conceptId,modality,revision}:{conceptId:string;modality:HeadModality;revision:string}){
  const facialReady=useVerifiedFacialTeaching(revision);
  const teaching=headTeachingForConcept(conceptId,modality,revision)??headMriOnlyTeachingForConcept(conceptId,modality,revision)??headInsulaTeachingForConcept(conceptId,modality,revision)??headOrbitalTeachingForConcept(conceptId,modality,revision)??headCtBoneTeachingForConcept(conceptId,modality,revision)??headCerebellarTeachingForConcept(conceptId,modality,revision)??(facialReady&&FACIAL_CONCEPTS.has(conceptId)&&modality==='CT'?headCtFacialTeachingForConcept(conceptId,modality,revision):null);
  if(!teaching)return null;
  const cited=new Set<string>([...teaching.note.anatomy.sources,...teaching.note.function.sources]);
  const sources=teaching.sources.filter(source=>cited.has(source.id));
  return <details className="head-teaching head-concept-teaching">
    <summary>Learn this concept · Draft</summary>
    <div>
      <p>No matching local mask is available for this tour step. These are general source-packet notes, not observations of this scan. References to a saved or regional mask describe the original teaching representation, not a mask available in this study.</p>
      <p>Image-reading tasks and scan-based practice are unavailable for this step. Any concept question below is unscored and does not identify anatomy on this scan.</p>
      <h4>Anatomy &amp; relationships</h4><p>{teaching.note.anatomy.text}</p>
      <h4>Function</h4><p>{teaching.note.function.text}</p>
      <HeadAnatomyCheck key={`${conceptId}:${revision}:${modality}`} conceptId={conceptId} revision={revision} surface={modality}/>
      <details><summary>Original packet scope &amp; references</summary>
        <p>This scope describes the original teaching packet, including its saved-mask context; this study has no matching mask for this step.</p>
        <p className="head-teaching-scope">{teaching.scope}</p>
        <ul>{sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
        <p>Teaching packet <code>{teaching.revision}</code> · awaiting radiologist review.</p>
      </details>
    </div>
  </details>;
}
