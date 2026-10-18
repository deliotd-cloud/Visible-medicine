import {HEAD_MRI_ANATOMY_CHECK_REVISION,headMriAnatomyCheckContent,headMriAnatomyCheckForConcept} from '../lib/head-mri-anatomy-checks.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';
import type {ReactNode} from 'react';

/** The authorized route supplies the independently verified complete packet revision. */
export function HeadMriAnatomyChecksReview({revision,questionRevision,reviewNotes}:{revision:string|null;questionRevision:string|null;reviewNotes?:ReactNode}){
  const checks=headMriAnatomyCheckContent.questions.map(question=>headMriAnatomyCheckForConcept(question.conceptId,revision??'','MRI',questionRevision??''));
  if(!revision||questionRevision!==HEAD_MRI_ANATOMY_CHECK_REVISION||checks.length!==4||checks.some(check=>!check))return <section id="head-mri-anatomy-check-review"><h2>MRI-only anatomy understanding checks</h2><p role="alert">The exact question and bound teaching packet is unavailable. No answer keys or targets have been substituted.</p></section>;
  return <details id="head-mri-anatomy-check-review" className="head-review-packet">
    <summary>MRI-only anatomy understanding checks · {checks.length} in a separate draft packet</summary>
    <p>{headMriAnatomyCheckContent.scope}</p>
    <p>Inspect the answer keys here and use this packet’s own private corrections below. Anatomy, MRI-only teaching and clinical histories remain separate. Saving corrections records no sign-off, exam answer or score.</p>
    <dl><dt>Question packet SHA-256</dt><dd><code>{questionRevision}</code></dd><dt>Bound MRI-only teaching SHA-256</dt><dd><code>{headMriAnatomyCheckContent.teachingRevision}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{revision}</code></dd></dl>
    <ol>{headMriAnatomyCheckContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
    {checks.map(check=>check&&<details key={check.question.id} id={`head-mri-anatomy-check-${check.question.conceptId}`}>
      <summary>{check.question.label}</summary>
      <h3>{check.question.prompt}</h3>
      <ul>{check.question.options.map(option=><li key={option.id}>{option.label}{option.id===check.question.correctOptionId?' · Correct answer':''}</li>)}</ul>
      <p>{check.question.explanation}</p>
      <p>Bound fact: {check.question.fact} · Source IDs: {check.question.sources.join(', ')}</p>
      <ul>{check.sources.map(source=><li key={source.id}><code>{source.id}</code> · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.reuse} Accessed {source.accessed}.</p></li>)}</ul>
      <p><HeadReviewImageLink conceptId={check.question.conceptId} modality="MRI" revision={revision}>Inspect question MRI target</HeadReviewImageLink> · <a href={check.binding.atlasHref}>Inspect question target in the existing 3D Atlas</a></p>
      <p>No exact CT counterpart is mapped. MRI and the existing 3D Atlas are separate, unregistered subjects.</p>
    </details>)}
    <p>{headMriAnatomyCheckContent.reuse}</p>
    {reviewNotes&&<details id="mri-anatomy-checks-corrections"><summary>Private corrections &amp; saved history</summary>{reviewNotes}</details>}
  </details>;
}
