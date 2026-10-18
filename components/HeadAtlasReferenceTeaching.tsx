'use client';
import {headTeachingForReference} from '../lib/head-atlas-teaching';
import {headMriOnlyTeachingForReference} from '../lib/head-mri-only-teaching';
import {headInsulaTeachingForReference} from '../lib/head-insula-teaching';
import {headOrbitalTeachingForReference} from '../lib/head-orbital-teaching';
import {headCtBoneTeachingForReference} from '../lib/head-ct-bone-teaching';
import {headCtFacialTeachingForReference} from '../lib/head-ct-facial-teaching.ts';
import {headCtFacialClinicalForReference} from '../lib/head-ct-facial-clinical.ts';
import {FACIAL_CONCEPTS,useVerifiedFacialTeaching} from './useVerifiedFacialTeaching';
import {brainstemClinicalForConcept} from '../lib/head-brainstem-clinical.ts';
import {ventricularClinicalForConcept} from '../lib/head-ventricular-clinical.ts';
import {deepGreyClinicalForConcept} from '../lib/head-deep-grey-clinical.ts';
import {lobarClinicalForConcept} from '../lib/head-lobar-clinical.ts';
import {hippocampalClinicalForConcept} from '../lib/head-hippocampal-clinical.ts';
import {mriOnlyClinicalForReference} from '../lib/head-mri-only-clinical.ts';
import {HeadAnatomyCheck} from './HeadAnatomyCheck';

export function HeadAtlasReferenceTeaching({conceptId,revision,live=false,compact=false}:{conceptId:string;revision:string;live?:boolean;compact?:boolean}){
  const facialReady=useVerifiedFacialTeaching(revision);
  const facial=FACIAL_CONCEPTS.has(conceptId)&&facialReady;
  const teaching=headTeachingForReference(conceptId,revision)??headMriOnlyTeachingForReference(conceptId,revision)??headInsulaTeachingForReference(conceptId,revision)??headOrbitalTeachingForReference(conceptId,revision)??headCtBoneTeachingForReference(conceptId,revision)??(facial?headCtFacialTeachingForReference(conceptId,revision):null);
  if(!teaching)return null;
  if(compact)return <section className="head-tour-caption" aria-label={`${teaching.concept.label} tour notes · draft`}>
    <p><strong>{teaching.concept.label}</strong> · {teaching.anatomy.text}</p>
    <details><summary>Scope &amp; sources · Draft</summary><p>{teaching.scope}</p><ul>{teaching.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><p>Original summary · teaching packet <code>{teaching.revision}</code> · awaiting radiologist review. Full anatomy, function and clinical notes remain below.</p></details>
  </section>;
  const clinical=brainstemClinicalForConcept(conceptId,'CT',revision)??ventricularClinicalForConcept(conceptId,'CT',revision)??deepGreyClinicalForConcept(conceptId,'CT',revision)??lobarClinicalForConcept(conceptId,'CT',revision)??hippocampalClinicalForConcept(conceptId,'CT',revision);
  const mriClinical=brainstemClinicalForConcept(conceptId,'MRI',revision)??ventricularClinicalForConcept(conceptId,'MRI',revision)??deepGreyClinicalForConcept(conceptId,'MRI',revision)??lobarClinicalForConcept(conceptId,'MRI',revision)??hippocampalClinicalForConcept(conceptId,'MRI',revision);
  const clinicalSources=clinical&&mriClinical?[...new Map([...clinical.sources,...mriClinical.sources].map(source=>[source.id,source])).values()]:[];
  const mriOnlyClinical=mriOnlyClinicalForReference(conceptId,revision);
  const facialClinical=facial?headCtFacialClinicalForReference(conceptId,revision):null;

  return <section className="head-reference-teaching" aria-label={`${teaching.concept.label} linked teaching draft`}>
    <h2>{teaching.concept.label} · linked anatomy draft</h2>
    <p>{live?'This teaching follows the supported selection in the model.':'This teaching follows the fixed linked focus or tour step; later selections inside the model do not change it.'}</p>
    <p className="head-teaching-scope">{teaching.scope}</p>
    <h3>Anatomy &amp; relationships</h3><p>{teaching.anatomy.text}</p>
    <h3>Function</h3><p>{teaching.function.text}</p>
    <HeadAnatomyCheck conceptId={conceptId} revision={revision} surface="3D"/>
    {facialClinical&&<details key={`${conceptId}:facial-clinical`}><summary>Clinical orientation &amp; reflection · Draft</summary>
      <h3>{facialClinical.note.title}</h3><p>{facialClinical.note.text}</p><p>{facialClinical.note.caution}</p>
      <p>General clinical orientation for a separate generic model. No CT observation, CT reading task or patient-space registration is shown here.</p>
      <h4>Think it through</h4><p>{facialClinical.note.question}</p>
      <details><summary>Reveal explanation</summary><p>{facialClinical.note.answer}</p><p>Reflection only · no score or completion recorded.</p></details>
      <p className="head-teaching-scope">{facialClinical.scope}</p>
      <details><summary>Clinical sources &amp; separate revision</summary><ul>{facialClinical.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul><p>Separate clinical packet <code>{facialClinical.revision}</code> · awaiting radiologist review.</p></details>
    </details>}
    {clinical&&mriClinical&&<details key={conceptId}><summary>Clinical correlation &amp; imaging pitfalls · Draft</summary>
      <h3>{clinical.note.title}</h3><p>{clinical.note.text}</p><p>{clinical.note.caution}</p>
      <p>These are general teaching correlations, not abnormalities demonstrated by this reference model. Open the linked scan to inspect its anatomy; the model and scans are not spatially registered.</p>
      <h4>CT pitfall</h4><p>{clinical.imaging.text}</p>
      <h4>MRI pitfall</h4><p>{mriClinical.imaging.text}</p>
      <h4>Think it through</h4><p>{clinical.note.question}</p>
      <details><summary>Reveal explanation</summary><p>{clinical.note.answer}</p><p>Reflection only · no score or completion recorded.</p></details>
      <p className="head-teaching-scope">{clinical.scope}</p>
      <details><summary>Clinical sources &amp; separate revision</summary>
        <ul>{clinicalSources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul>
        <p>Separate clinical packet <code>{clinical.revision}</code> · awaiting radiologist review. Existing anatomy-note reviews do not cover this extension.</p>
      </details>
    </details>}
    {mriOnlyClinical&&<details key={`${conceptId}:mri-only-clinical`}><summary>Clinical correlation &amp; reflection · Draft</summary>
      <h3>{mriOnlyClinical.note.title}</h3><p>{mriOnlyClinical.note.text}</p><p>{mriOnlyClinical.note.caution}</p>
      <p>General clinical teaching, not an abnormality demonstrated by this reference model. The native MRI and existing 3D Atlas are separate, unregistered subjects. No exact CT correspondence is mapped.</p>
      <h4>Think it through</h4><p>{mriOnlyClinical.note.question}</p>
      <details><summary>Reveal explanation</summary><p>{mriOnlyClinical.note.answer}</p><p>Reflection only · no score or completion recorded.</p></details>
      <p className="head-teaching-scope">{mriOnlyClinical.scope}</p>
      <details><summary>Clinical sources &amp; separate revision</summary>
        <ul>{mriOnlyClinical.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul>
        <p>Separate clinical packet <code>{mriOnlyClinical.revision}</code> · awaiting radiologist review. Existing anatomy-note reviews do not cover this extension.</p>
      </details>
    </details>}
    <details><summary>References &amp; review revision</summary>
      <ul>{teaching.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p>Original summaries; references do not imply endorsement. No external figures or datasets were imported.</p>
      <p>Teaching packet <code>{teaching.revision}</code> · awaiting radiologist review.</p>
    </details>
  </section>;
}
