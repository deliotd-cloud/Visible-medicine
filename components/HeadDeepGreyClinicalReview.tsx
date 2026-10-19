import type {ReactNode} from 'react';
import {DEEP_GREY_CLINICAL_REVISION,deepGreyClinicalContent,deepGreyClinicalForConcept} from '../lib/head-deep-grey-clinical.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Mounted only behind the existing authorized Head learning Review route. */
export function HeadDeepGreyClinicalReview({revision,clinicalRevision,reviewNotes}:{revision:string;clinicalRevision:string|null;reviewNotes?:ReactNode}){
  if(revision!==HEAD_LINK_REVISION||clinicalRevision!==DEEP_GREY_CLINICAL_REVISION)return <section id="deep-grey-clinical-review"><h2>Deep-grey clinical draft unavailable</h2><p role="alert">The source or independent clinical packet changed. No targets have been substituted.</p></section>;
  return <section id="deep-grey-clinical-review" className="head-mri-comparison" aria-label="Deep-grey clinical teaching review"><details>
    <summary>Deep-grey clinical correlations · 8 draft notes</summary>
    <p>{deepGreyClinicalContent.scope}</p>
    <p>Draft evidence, not clinical approval. Earlier anatomy, comparison, quiz or clinical reviews do not approve this packet. {reviewNotes?'Use only its independent private correction form below.':'Private corrections are unavailable here.'} Do not save its corrections against another packet.</p>
    <dl><dt>Clinical packet SHA-256</dt><dd><code>{clinicalRevision}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{revision}</code></dd></dl>
    {deepGreyClinicalContent.notes.map(note=>{
      const item=deepGreyClinicalForConcept(note.conceptId,'CT',revision);
      if(!item)return <p role="alert" key={note.conceptId}>Clinical target unavailable; reload before reviewing.</p>;
      return <details key={note.conceptId} id={'deep-grey-clinical-'+note.conceptId}><summary>{note.title}</summary>
        <p>{note.text}</p><p>{note.caution}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect {item.binding.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect {item.binding.label} in MRI</HeadReviewImageLink> · <a href={item.binding.atlasHref}>Inspect {item.binding.label} in the existing 3D Atlas</a></p>
        <dl><dt>Concept ID</dt><dd><code>{note.conceptId}</code></dd></dl>
        <h3>Reflection</h3><p>{note.question}</p><p>{note.answer}</p><p>Reflection only · no score or completion recorded.</p>
      </details>;
    })}
    <details><summary>CT and MRI pitfalls</summary><h3>CT</h3><p>{deepGreyClinicalContent.imaging.CT.text}</p><h3>MRI</h3><p>{deepGreyClinicalContent.imaging.MRI.text}</p></details>
    <details><summary>Primary sources and review checklist</summary><ul>{deepGreyClinicalContent.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul><ol>{deepGreyClinicalContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol><p>{deepGreyClinicalContent.reuse}</p><p>Sources accessed {deepGreyClinicalContent.accessed}.</p></details>
    {reviewNotes&&<details id="deep-grey-clinical-corrections"><summary>Private corrections &amp; saved history</summary>{reviewNotes}</details>}
  </details></section>;
}
