import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {MRI_ONLY_CLINICAL_REVISION,mriOnlyClinicalContent,mriOnlyClinicalForConcept} from '../lib/head-mri-only-clinical.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';
import type {ReactNode} from 'react';

/** Read-only draft evidence; the authorized route verifies this exact packet first. */
export function HeadMriOnlyClinicalReview({revision,clinicalRevision,reviewNotes}:{revision:string;clinicalRevision:string|null;reviewNotes?:ReactNode}){
  const notes=mriOnlyClinicalContent.notes;
  const bindings=notes.map(note=>mriOnlyClinicalForConcept(note.conceptId,'MRI',revision));
  if(revision!==HEAD_LINK_REVISION||revision!==mriOnlyClinicalContent.headRevision||
    clinicalRevision!==MRI_ONLY_CLINICAL_REVISION||notes.length!==2||bindings.some(item=>!item)){
    return <section id="mri-only-clinical-review" className="head-mri-comparison" aria-label="MRI-only clinical teaching review"><h2>MRI-only clinical draft unavailable</h2><p role="alert">The head source, independent clinical packet or MRI binding changed. No targets have been substituted.</p></section>;
  }
  return <section id="mri-only-clinical-review" className="head-mri-comparison" aria-label="MRI-only clinical teaching review"><details>
    <summary>MRI-only clinical correlations · 2 draft notes</summary>
    <p>{mriOnlyClinicalContent.scope}</p>
    <p>This independent draft awaits revision-bound radiologist review. Use its own private corrections below; other anatomy, MRI teaching and clinical forms remain separate. Neither opening notes nor saving corrections approves this packet.</p>
    <dl><dt>Clinical packet SHA-256</dt><dd><code>{clinicalRevision}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{revision}</code></dd></dl>
    {notes.map((note,index)=>{
      const item=bindings[index]!;
      return <details key={note.conceptId} id={'mri-only-clinical-'+note.conceptId}><summary>{note.title}</summary>
        <p>{note.text}</p><p>{note.caution}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect {item.binding.label} in MRI</HeadReviewImageLink> · <a href={item.binding.atlasHref}>Inspect {item.binding.label} in the existing 3D Atlas</a></p>
        <p>No exact CT correspondence is mapped. The MRI and existing 3D Atlas are separate, unregistered subjects.</p>
        <dl><dt>Concept ID</dt><dd><code>{note.conceptId}</code></dd><dt>Native MRI target</dt><dd><code>{item.binding.mriHref}</code></dd><dt>Existing 3D target</dt><dd><code>{item.binding.atlasHref}</code></dd></dl>
        <h3>MRI reading caveat</h3><p>{item.imaging.text}</p><p>Imaging sources: {item.imaging.sources.join(', ')}</p>
        <h3>Reflection</h3><p>{note.question}</p><p>{note.answer}</p><p>Reflection only · no score or completion recorded.</p>
        <p>Clinical sources: {note.sources.join(', ')}</p>
      </details>;
    })}
    <details><summary>Primary sources, reuse and review checklist</summary>
      <ul>{mriOnlyClinicalContent.sources.map(source=><li key={source.id}><code>{source.id}</code> · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul>
      <ol>{mriOnlyClinicalContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      <p>{mriOnlyClinicalContent.reuse}</p><p>Sources accessed {mriOnlyClinicalContent.accessed}.</p>
    </details>
    {reviewNotes&&<details id="mri-only-clinical-corrections"><summary>Private corrections &amp; saved history</summary>{reviewNotes}</details>}
  </details></section>;
}
