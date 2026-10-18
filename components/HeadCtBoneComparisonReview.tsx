import {HEAD_CT_BONE_COMPARISON_REVISION,type HeadCtBoneComparisonPacket} from '../lib/head-ct-bone-comparison-review';
import {HeadCtBoneDecisionPanel} from './HeadCtBoneDecisionPanel';
import {HeadCtBoneLearningReview} from './HeadCtBoneLearningReview';
import {HEAD_CT_BONE_TEACHING_REVISION} from '../lib/head-ct-bone-teaching';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {HeadCtBoneTeachingDecisionPanel} from './HeadCtBoneTeachingDecisionPanel';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** The authorized server route supplies verified evidence; review loads on demand. */
export function HeadCtBoneComparisonReview({packet,teachingRevision}:{packet:HeadCtBoneComparisonPacket|null;teachingRevision?:string|null}){
  const teachingReady=teachingRevision===HEAD_CT_BONE_TEACHING_REVISION;
  return <section id="ct-bone-comparisons" className="head-mri-comparison" aria-label="CT-only bone comparison review">
    {!packet?<><h2>CT bone comparisons unavailable</h2><p role="alert">The source or comparison packet changed. No targets have been substituted.</p></>:<details>
      <summary>CT-only skull bones · {packet.items.length} draft bindings</summary>
      <p>{packet.scope}</p>
      <p>Open an individual comparison to inspect both views and record your review. These decisions are separate from teaching and MRI notes.</p>
      <dl><dt>Comparison packet SHA-256</dt><dd><code>{HEAD_CT_BONE_COMPARISON_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      <h3>Comparison checklist</h3><ol>{packet.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      <HeadCtBoneLearningReview manifestRevision={packet.headRevision}/>
      {teachingReady?<p>Separate teaching draft <code>{teachingRevision}</code> · inspect and review the notes below. Existing comparison or tour decisions do not approve this teaching; record any teaching decision separately.</p>:<p>Linked teaching evidence is unavailable for this revision. Independently verified comparisons remain available.</p>}
      {packet.items.map(item=><details key={item.conceptId} id={'head-ct-bone-comparison-'+item.conceptId}>
        <summary>{item.binding!.label} · partial CT mask</summary>
        <p>{item.binding!.scopeNote}</p>
        <p><HeadReviewImageLink conceptId={item.conceptId} modality="CT" revision={packet.headRevision}>Inspect {item.binding!.label} in CT</HeadReviewImageLink> · <a href={item.binding!.atlasHref}>Inspect {item.binding!.label} in existing 3D Atlas</a></p>
        <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd>
          <dt>Native CT ID</dt><dd><code>{item.ct.id}</code></dd><dt>Raw source label</dt><dd>{item.ct.label}</dd>
          <dt>Laterality</dt><dd>{item.ct.laterality}</dd><dt>CT representation</dt><dd>{item.ct.representation}</dd>
          <dt>Generic bone ID</dt><dd><code>{item.atlas.structureId}</code></dd><dt>Generic source SHA-256</dt><dd><code>{item.atlas.sourceHash}</code></dd>
        </dl>
        {teachingReady&&<HeadAtlasTeaching conceptId={item.conceptId} modality="CT" revision={packet.headRevision}/>}
        {teachingReady&&<HeadCtBoneTeachingDecisionPanel key={packet.headRevision+teachingRevision+item.conceptId} manifestRevision={packet.headRevision} conceptId={item.conceptId} label={item.binding!.label}/>}
        <HeadCtBoneDecisionPanel key={packet.headRevision+item.conceptId} manifestRevision={packet.headRevision} conceptId={item.conceptId} label={item.binding!.label}/>
      </details>)}
    </details>}
  </section>;
}
