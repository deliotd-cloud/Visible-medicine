import type {ReactNode} from 'react';
import {HIPPOCAMPAL_CLINICAL_REVISION,hippocampalClinicalContent,hippocampalClinicalForConcept} from '../lib/head-hippocampal-clinical.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Draft evidence, mounted only by the existing authorized Head learning route. */
export function HeadHippocampalClinicalReview({revision,clinicalRevision,reviewNotes}:{revision:string;clinicalRevision:string|null;reviewNotes?:ReactNode}){
  if(revision!==HEAD_LINK_REVISION||clinicalRevision!==HIPPOCAMPAL_CLINICAL_REVISION)return <section id="hippocampal-clinical-review"><h2>Hippocampal clinical draft unavailable</h2><p role="alert">The head source or independent clinical packet changed. No targets have been substituted.</p></section>;
  return <section id="hippocampal-clinical-review" className="head-mri-comparison" aria-label="Hippocampal clinical teaching review"><details>
    <summary>Hippocampal clinical correlations · 2 draft notes</summary>
    <p>{hippocampalClinicalContent.scope}</p>
    <p>The original hippocampal anatomy and imaging teaching is reused as source context. These clinical correlations are a separate draft awaiting revision-bound radiologist review; earlier anatomy or clinical reviews do not approve this packet. {reviewNotes?'Use only its independent private correction form below.':'Private corrections are unavailable here.'} Do not save its corrections against another packet.</p>
    <p>The linked CT, MRI and existing 3D Atlas are separate subjects. Neither the masks nor these links establish hippocampal sclerosis, epileptogenicity, memory performance, subfield boundaries, volumetry or patient-space registration.</p>
    <dl><dt>Clinical packet SHA-256</dt><dd><code>{clinicalRevision}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{revision}</code></dd></dl>
    {hippocampalClinicalContent.notes.map(note=>{
      const item=hippocampalClinicalForConcept(note.conceptId,'CT',revision);
      if(!item)return <p role="alert" key={note.conceptId}>Clinical target unavailable; reload before reviewing.</p>;
      return <details key={note.conceptId} id={'hippocampal-clinical-'+note.conceptId}><summary>{note.title}</summary>
        <p>{note.text}</p><p>{note.caution}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect {item.binding.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect {item.binding.label} in MRI</HeadReviewImageLink> · <a href={item.binding.atlasHref}>Inspect {item.binding.label} in the existing 3D Atlas</a></p>
        <dl><dt>Concept ID</dt><dd><code>{note.conceptId}</code></dd></dl>
        <h3>Reflection</h3><p>{note.question}</p><p>{note.answer}</p><p>Reflection only · no score or completion recorded.</p>
        <p>Sources: {note.sources.join(', ')}</p>
      </details>;
    })}
    <details><summary>CT and MRI pitfalls</summary><h3>CT</h3><p>{hippocampalClinicalContent.imaging.CT.text}</p><h3>MRI</h3><p>{hippocampalClinicalContent.imaging.MRI.text}</p></details>
    <details><summary>Primary sources and review checklist</summary><ul>{hippocampalClinicalContent.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul><ol>{hippocampalClinicalContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol><p>{hippocampalClinicalContent.reuse}</p><p>Sources accessed {hippocampalClinicalContent.accessed}.</p></details>
    {reviewNotes&&<details id="hippocampal-clinical-corrections"><summary>Private corrections &amp; saved history</summary>{reviewNotes}</details>}
  </details></section>;
}
