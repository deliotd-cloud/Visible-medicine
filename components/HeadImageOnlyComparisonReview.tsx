import {HEAD_IMAGE_ONLY_COMPARISON_REVISION,type HeadImageOnlyComparisonPacket} from '../lib/head-image-only-comparison-review';
import {headImageConceptById} from '../lib/head-image-only-links';
import {HeadPairedDecisionPanel} from './HeadPairedDecisionPanel';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {HEAD_CEREBELLAR_TEACHING_REVISION} from '../lib/head-cerebellar-teaching';
import {HEAD_CEREBELLAR_LEARNING_REVISION,headCerebellarLearningSequences} from '../lib/head-cerebellar-learning.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Supplied only after authorization and independent packet verification. */
export function HeadImageOnlyComparisonReview({packet,teachingRevision,learningRevision}:{packet:HeadImageOnlyComparisonPacket|null;teachingRevision?:string|null;learningRevision?:string|null}){
  return <section id="image-only-comparisons" className="head-mri-comparison" aria-label="Cerebellar CT and MRI comparison review">
    {!packet?<><h2>Cerebellar comparisons unavailable</h2><p role="alert">The exact source or comparison packet changed. No targets have been substituted.</p></>:<details>
      <summary>Cerebellar CT/MRI comparisons · {packet.bindings.length} draft bindings</summary>
      <p>Compare the saved CT and MRI representations independently. These are different, unregistered subjects. No exact corresponding part is mapped in the existing 3D Atlas.</p>
      <p>Open a comparison to inspect its native identities and record a private decision. Acceptance covers the educational concept comparison only, not mask geometry, teaching, clinical use or publication.</p>
      {teachingRevision===HEAD_CEREBELLAR_TEACHING_REVISION?<p>Independent cerebellar teaching draft <code>{teachingRevision}</code>. Read both modalities below; comparison acceptance does not approve these notes.</p>:<p>Cerebellar teaching is unavailable or changed. Comparison evidence remains separate.</p>}
      <dl><dt>Comparison packet SHA-256</dt><dd><code>{HEAD_IMAGE_ONLY_COMPARISON_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      {learningRevision===HEAD_CEREBELLAR_LEARNING_REVISION&&<details><summary>Cerebellar guided sequence · independent draft</summary><p>Sequence revision <code>{learningRevision}</code>. Teaching and comparison decisions do not approve its order, navigation or practice. No exact 3D part is mapped.</p>{headCerebellarLearningSequences.map(sequence=><ol key={sequence.id}>{sequence.concepts.map(id=>{const links=headLearningLinks({sequenceId:sequence.id,conceptId:id});return <li key={id}>{headImageConceptById(id)?.label} · {links?.ctHref&&<a href={links.ctHref}>Inspect CT step</a>} · {links?.mriHref&&<a href={links.mriHref}>Inspect MRI step</a>}</li>;})}</ol>)}</details>}
      {packet.bindings.map(item=>{
        const binding=headImageConceptById(item.conceptId);
        if(!binding||binding.atlasHref)return <p role="alert" key={item.conceptId}>Comparison target changed. Reload before reviewing.</p>;
        return <details id={'head-image-only-comparison-'+item.conceptId} key={item.conceptId}>
          <summary>{binding.label} · CT / MRI{item.mri.representation==='partial-mask'?' partial coverage':''}</summary>
          <p>{binding.scopeNote}</p>
          <p><HeadReviewImageLink conceptId={item.conceptId} modality="CT" revision={packet.headRevision}>Inspect {binding.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}>Inspect {binding.label} in MRI</HeadReviewImageLink></p>
          <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd>
            <dt>Native CT ID</dt><dd><code>{item.ct.id}</code></dd><dt>Native MRI ID</dt><dd><code>{item.mri.id}</code></dd>
            <dt>Raw CT source label</dt><dd>{item.ct.label}</dd><dt>Raw MRI source label</dt><dd>{item.mri.label}</dd>
            <dt>CT laterality</dt><dd>{item.ct.laterality}</dd><dt>MRI laterality</dt><dd>{item.mri.laterality}</dd>
            <dt>CT representation</dt><dd>{item.ct.representation}</dd><dt>MRI representation</dt><dd>{item.mri.representation}</dd>
          </dl>
          <HeadPairedDecisionPanel key={packet.headRevision+item.conceptId} manifestRevision={packet.headRevision} conceptId={item.conceptId} label={binding.label}/>
          {teachingRevision===HEAD_CEREBELLAR_TEACHING_REVISION&&<><h3>{binding.label} · CT teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="CT" revision={packet.headRevision}/><h3>{binding.label} · MRI teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}/></>}
        </details>;
      })}
    </details>}
  </section>;
}
