'use client';
import {headTeachingForConcept} from '../lib/head-atlas-teaching';
import {headMriOnlyTeachingForConcept} from '../lib/head-mri-only-teaching';
import {headInsulaTeachingForConcept} from '../lib/head-insula-teaching';
import {headOrbitalTeachingForConcept} from '../lib/head-orbital-teaching';
import {headCtBoneTeachingForConcept} from '../lib/head-ct-bone-teaching';
import {headCtFacialTeachingForConcept} from '../lib/head-ct-facial-teaching.ts';
import {headCtFacialClinicalForConcept} from '../lib/head-ct-facial-clinical.ts';
import {FACIAL_CONCEPTS,useVerifiedFacialTeaching} from './useVerifiedFacialTeaching';
import {headCerebellarTeachingForConcept} from '../lib/head-cerebellar-teaching';
import type {HeadModality} from '../lib/head-atlas-links';
import {brainstemClinicalForConcept} from '../lib/head-brainstem-clinical.ts';
import {ventricularClinicalForConcept} from '../lib/head-ventricular-clinical.ts';
import {cerebellarClinicalForConcept} from '../lib/head-cerebellar-clinical.ts';
import {deepGreyClinicalForConcept} from '../lib/head-deep-grey-clinical.ts';
import {lobarClinicalForConcept} from '../lib/head-lobar-clinical.ts';
import {hippocampalClinicalForConcept} from '../lib/head-hippocampal-clinical.ts';
import {mriOnlyClinicalForConcept} from '../lib/head-mri-only-clinical.ts';
import {HeadAnatomyCheck} from './HeadAnatomyCheck';

type HeadAtlasTeachingProps={conceptId:string;modality:HeadModality;revision:string;summary?:string;unavailableMessage?:string;showAnatomyCheck?:boolean};

export function HeadAtlasTeaching({conceptId,modality,revision,summary='Learn this anatomy · Draft',unavailableMessage,showAnatomyCheck=true}:HeadAtlasTeachingProps){
  const facialReady=useVerifiedFacialTeaching(revision);
  const facial=FACIAL_CONCEPTS.has(conceptId)&&modality==='CT'&&facialReady;
  const teaching=headTeachingForConcept(conceptId,modality,revision)??headMriOnlyTeachingForConcept(conceptId,modality,revision)??headInsulaTeachingForConcept(conceptId,modality,revision)??headOrbitalTeachingForConcept(conceptId,modality,revision)??headCtBoneTeachingForConcept(conceptId,modality,revision)??headCerebellarTeachingForConcept(conceptId,modality,revision)??(facial?headCtFacialTeachingForConcept(conceptId,modality,revision):null);
  if(!teaching)return unavailableMessage?<details key={`${conceptId}:${modality}`} className="head-teaching"><summary>{summary}</summary><p className="head-teaching-unavailable">{unavailableMessage}</p></details>:null;
  const clinical=brainstemClinicalForConcept(conceptId,modality,revision)??ventricularClinicalForConcept(conceptId,modality,revision)??cerebellarClinicalForConcept(conceptId,modality,revision)??deepGreyClinicalForConcept(conceptId,modality,revision)??lobarClinicalForConcept(conceptId,modality,revision)??hippocampalClinicalForConcept(conceptId,modality,revision)??mriOnlyClinicalForConcept(conceptId,modality,revision)??(facial?headCtFacialClinicalForConcept(conceptId,modality,revision):null);
  return <details key={`${conceptId}:${modality}`} className="head-teaching">
    <summary>{summary}</summary>
    <div>
      <p className="head-teaching-scope">Draft teaching for partial or simplified anatomy. CT, MRI and 3D show separate subjects and are not spatially registered.</p>
      <h4>Anatomy &amp; relationships</h4><p>{teaching.note.anatomy.text}</p>
      <h4>Function</h4><p>{teaching.note.function.text}</p>
      <h4>{modality} · reading the image</h4><p>{teaching.imaging.text}</p>
      <h4>Try this</h4><p>{teaching.note.task}</p>
      {showAnatomyCheck&&<HeadAnatomyCheck conceptId={conceptId} revision={revision} surface={modality}/>}
      {clinical&&<details><summary>Clinical correlation · Draft</summary>
        <h4>{clinical.note.title}</h4><p>{clinical.note.text}</p><p>{clinical.note.caution}</p>
        <h4>{modality} pitfall</h4><p>{clinical.imaging.text}</p>
        <h4>Think it through</h4><p>{clinical.note.question}</p>
        <details><summary>Reveal explanation</summary><p>{clinical.note.answer}</p><p>Reflection only · no score or completion recorded.</p></details>
        <p className="head-teaching-scope">{clinical.scope}</p>
        <details><summary>Clinical sources &amp; separate revision</summary><ul>{clinical.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul><p>Separate clinical packet <code>{clinical.revision}</code> · awaiting radiologist review. Existing anatomy-note reviews do not cover this extension.</p></details>
      </details>}
      <details><summary>Scope &amp; sources · Draft</summary>
        <p className="head-teaching-scope">{teaching.scope}</p>
        <ul>{teaching.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
        <p>Original summaries; references do not imply endorsement. No external diagrams or datasets were imported.</p>
        <p>Teaching packet <code>{teaching.revision}</code> · awaiting radiologist review.</p>
      </details>
    </div>
  </details>;
}
