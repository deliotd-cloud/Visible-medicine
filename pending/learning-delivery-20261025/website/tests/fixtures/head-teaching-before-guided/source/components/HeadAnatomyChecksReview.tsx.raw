import {HEAD_ANATOMY_CHECK_REVISION,headAnatomyCheckContent,headAnatomyCheckForConcept} from '../lib/head-anatomy-checks.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Independent read-only questions: no earlier teaching decision is inherited. */
export function HeadAnatomyChecksReview({revision,questionRevision}:{revision:string;questionRevision:string|null}){
  const checks=headAnatomyCheckContent.questions.map(question=>headAnatomyCheckForConcept(question.conceptId,revision,questionRevision??''));
  if(questionRevision!==HEAD_ANATOMY_CHECK_REVISION||checks.some(check=>!check))return <section id="head-anatomy-check-review"><h2>Anatomy knowledge checks</h2><p role="alert">The exact question packet is unavailable. No answer key or review decision has been substituted.</p></section>;
  return <details id="head-anatomy-check-review" className="head-review-packet">
    <summary>Anatomy knowledge checks · {checks.length} in a separate draft packet</summary>
    <p>{headAnatomyCheckContent.scope}</p>
    <p>Read-only review. Earlier anatomy, clinical and sequence decisions do not approve these questions. No sign-off is recorded here.</p>
    <dl><dt>Question packet SHA-256</dt><dd><code>{questionRevision}</code></dd><dt>Bound anatomy teaching SHA-256</dt><dd><code>{headAnatomyCheckContent.teachingRevision}</code></dd></dl>
    <ol>{headAnatomyCheckContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
    {checks.map(check=>check&&<details key={check.question.id}>
      <summary>{check.question.label}</summary>
      <h3>{check.question.prompt}</h3>
      <ul>{check.question.options.map(option=><li key={option.id}>{option.label}{option.id===check.question.correctOptionId?' · Correct answer':''}</li>)}</ul>
      <p>{check.question.explanation}</p>
      <ul>{check.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p><HeadReviewImageLink conceptId={check.question.conceptId} modality="CT" revision={revision}>Inspect question CT target</HeadReviewImageLink> · <HeadReviewImageLink conceptId={check.question.conceptId} modality="MRI" revision={revision}>Inspect question MRI target</HeadReviewImageLink> · <a href={check.binding.atlasHref}>Inspect question 3D target</a></p>
    </details>)}
    <p>{headAnatomyCheckContent.reuse}</p>
  </details>;
}
