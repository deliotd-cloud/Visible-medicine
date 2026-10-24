import {HEAD_MRI_COMPARISON_REVISION,type HeadMriComparisonPacket} from '../lib/head-mri-comparison-review';
import {HEAD_MRI_ONLY_TEACHING_REVISION} from '../lib/head-mri-only-teaching';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {headMriLearningPacket,HEAD_MRI_LEARNING_REVISION} from '../lib/head-mri-learning';
import {headLearningLinks} from '../lib/head-atlas-learning';
import type {ReactNode} from 'react';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Server supplies the independently hash-verified packet after clinical-review authorization. */
export function HeadMriComparisonReview({packet,teachingRevision,learningRevision,reviewNotes}:{packet:HeadMriComparisonPacket|null;teachingRevision?:string|null;learningRevision?:string|null;reviewNotes?:ReactNode}){
  if(!packet)return <section id="mri-only-comparisons" className="head-mri-comparison" aria-label="MRI-only comparison review"><h2>MRI-only comparisons unavailable</h2><p role="alert">The exact head source or comparison packet changed. No targets have been substituted. Teaching review remains separate.</p></section>;
  return <section id="mri-only-comparisons" className="head-mri-comparison" aria-label="MRI-only comparison review">
    <details>
      <summary>MRI-only comparisons · {packet.items.length} draft bindings</summary>
      <p>{packet.scope}</p>
      <p>{reviewNotes?'The separate MRI form records private correction drafts, not clinical decisions.':'This read-only packet has no saved decision.'} The teaching form and guided-sequence packet do not approve these comparisons.</p>
      {teachingRevision===HEAD_MRI_ONLY_TEACHING_REVISION?<p>Four MRI-only teaching drafts have a separate packet <code>{teachingRevision}</code>. Review their facts, references, exercises and source limits below; the original teaching form does not record decisions for them.</p>:<p role="alert">The separate MRI-only teaching packet is unavailable or changed. Comparison evidence remains separate; no teaching decision is inherited.</p>}
      {learningRevision===HEAD_MRI_LEARNING_REVISION?<details><summary>MRI-only guided sequences · separate draft</summary><p>{headMriLearningPacket().scope}</p><p>Sequence packet <code>{learningRevision}</code>. No saved sign-off; the existing form records no sequence decision.</p>{headMriLearningPacket().sequences.map(sequence=><details key={sequence.id} id={'head-guided-sequence-'+sequence.id}><summary>{sequence.label} · {sequence.concepts.length} steps</summary><ol>{sequence.concepts.map(conceptId=>{
        const links=headLearningLinks({sequenceId:sequence.id,conceptId}),binding=sequence.bindings.find(binding=>binding?.conceptId===conceptId);
        return <li key={conceptId}>{binding?.label??conceptId}{links&&<> · <a href={links.atlasHref}>Inspect 3D step</a> · <a href={links.mriHref}>Inspect MRI step</a></>}</li>;
      })}</ol></details>)}</details>:<p role="alert">MRI-only guided sequence evidence is unavailable or changed. No sequence decision is inherited.</p>}
      <dl><dt>Comparison packet SHA-256</dt><dd><code>{HEAD_MRI_COMPARISON_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      <h3>Comparison checklist</h3><ol>{packet.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {packet.items.map(item=><details key={item.conceptId} id={'head-mri-comparison-'+item.conceptId}>
        <summary>{item.binding!.label} · {item.representation==='partial-mask'?'partial MRI mask':'MRI mask'}</summary>
        <p>{item.binding!.scopeNote}</p>
        <p><HeadReviewImageLink conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}>Inspect {item.binding!.label} in MRI</HeadReviewImageLink> · <a href={item.binding!.atlasHref}>Inspect {item.binding!.label} in existing 3D Atlas</a></p>
        <p>No exact CT comparison mapped.</p>
        {teachingRevision===HEAD_MRI_ONLY_TEACHING_REVISION&&<HeadAtlasTeaching conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}/>}
        <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd><dt>Native MRI ID</dt><dd><code>{item.nativeId}</code></dd><dt>Raw source label</dt><dd>{item.rawLabel}</dd><dt>Native laterality</dt><dd><code>{item.laterality}</code></dd><dt>Representation</dt><dd><code>{item.representation}</code></dd><dt>Generic 3D structure ID</dt><dd><code>{item.atlasId}</code></dd><dt>Generic bundle</dt><dd><code>{item.atlasBundle}</code></dd><dt>Generic source SHA-256</dt><dd><code>{item.atlasSource}</code></dd></dl>
      </details>)}
      {reviewNotes&&teachingRevision===HEAD_MRI_ONLY_TEACHING_REVISION&&learningRevision===HEAD_MRI_LEARNING_REVISION&&<details><summary>MRI notes &amp; corrections · separate private history</summary>{reviewNotes}</details>}
    </details>
  </section>;
}
