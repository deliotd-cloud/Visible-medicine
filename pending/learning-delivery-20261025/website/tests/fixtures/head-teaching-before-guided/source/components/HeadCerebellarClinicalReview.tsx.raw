import type {ReactNode} from 'react';
import {CEREBELLAR_CLINICAL_REVISION,cerebellarClinicalContent,cerebellarClinicalForConcept} from '../lib/head-cerebellar-clinical.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';
import {headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';

/** Only mounted behind the existing authorized Head learning Review route. */
export function HeadCerebellarClinicalReview({revision,clinicalRevision,reviewNotes}:{revision:string;clinicalRevision:string|null;reviewNotes?:ReactNode}){
  if(revision!==HEAD_LINK_REVISION||clinicalRevision!==CEREBELLAR_CLINICAL_REVISION)return <section id="cerebellar-clinical-review"><h2>Cerebellar clinical draft unavailable</h2><p role="alert">The source or independent clinical packet changed. No clinical targets have been substituted.</p></section>;
  return <section id="cerebellar-clinical-review" className="head-mri-comparison" aria-label="Cerebellar clinical teaching review"><details>
    <summary>Cerebellar clinical correlations · 3 draft notes</summary>
    <p>{cerebellarClinicalContent.scope}</p>
    <p>Draft evidence with separate private correction notes when available. Saving notes records no clinical sign-off or publication. Earlier anatomy, comparison or guided-learning reviews do not approve this packet.</p>
    <dl><dt>Clinical packet SHA-256</dt><dd><code>{clinicalRevision}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{revision}</code></dd><dt>Comparison packet SHA-256</dt><dd><code>{cerebellarClinicalContent.comparisonRevision}</code></dd></dl>
    {cerebellarClinicalContent.notes.map(note=>{
      const item=cerebellarClinicalForConcept(note.conceptId,'CT',revision);
      const native=headImageOnlyComparisonPacket().bindings.find(binding=>binding.conceptId===note.conceptId);
      if(!item||!native)return <p role="alert" key={note.conceptId}>Clinical target unavailable; reload before reviewing.</p>;
      return <details key={note.conceptId} id={'cerebellar-clinical-'+note.conceptId}><summary>{note.title}</summary>
        <p>{note.text}</p><p>{note.caution}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect {item.binding.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect {item.binding.label} in MRI</HeadReviewImageLink></p>
        <dl><dt>Concept ID</dt><dd><code>{note.conceptId}</code></dd><dt>Native CT ID</dt><dd><code>{native.ct.id}</code></dd><dt>Native MRI ID</dt><dd><code>{native.mri.id}</code></dd><dt>MRI representation</dt><dd>{native.mri.representation}</dd></dl>
        <h3>Reflection</h3><p>{note.question}</p><p>{note.answer}</p>
      </details>;
    })}
    <details><summary>CT and MRI pitfalls</summary><h3>CT</h3><p>{cerebellarClinicalContent.imaging.CT.text}</p><h3>MRI</h3><p>{cerebellarClinicalContent.imaging.MRI.text}</p></details>
    <details><summary>Primary sources and review checklist</summary><ul>{cerebellarClinicalContent.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul><ol>{cerebellarClinicalContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol><p>{cerebellarClinicalContent.reuse}</p><p>Sources accessed {cerebellarClinicalContent.accessed}.</p></details>
    {reviewNotes&&<details id="cerebellar-clinical-corrections"><summary>Private corrections &amp; saved history</summary>{reviewNotes}</details>}
  </details></section>;
}
