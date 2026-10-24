import {HEAD_INSULA_COMPARISON_REVISION,type HeadInsulaComparisonPacket} from '../lib/head-insula-comparison-review';
import {HEAD_INSULA_TEACHING_REVISION} from '../lib/head-insula-teaching';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {HEAD_INSULA_LEARNING_REVISION,headInsulaLearningPacket} from '../lib/head-insula-learning';
import {headLearningLinks} from '../lib/head-atlas-learning';
import {HeadPairedDecisionPanel} from './HeadPairedDecisionPanel';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Only the authorized server route supplies the independently verified packet. */
export function HeadInsulaComparisonReview({packet,teachingRevision,learningRevision}:{packet:HeadInsulaComparisonPacket|null;teachingRevision?:string|null;learningRevision?:string|null}){
  return <section id="insula-comparisons" className="head-mri-comparison" aria-label="Insula comparison review">
    {!packet?<><h2>Insula comparisons unavailable</h2><p role="alert">The exact source or comparison packet changed. No targets have been substituted. Other review packets remain separate.</p></>:<details>
      <summary>Insula comparisons · {packet.items.length} draft bindings</summary>
      <p>{packet.scope}</p>
      <p>Open an individual comparison to inspect CT, MRI and 3D, then record your private review. Teaching and guided learning remain separate review items.</p>
      {teachingRevision===HEAD_INSULA_TEACHING_REVISION?<p>Separate insula teaching draft <code>{teachingRevision}</code>. Review the modality-specific notes below; no existing form records its approval.</p>:<p role="alert">Insula teaching is unavailable or changed. Valid comparison evidence remains separate.</p>}
      <dl><dt>Comparison packet SHA-256</dt><dd><code>{HEAD_INSULA_COMPARISON_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      <h3>Comparison checklist</h3><ol>{packet.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {learningRevision===HEAD_INSULA_LEARNING_REVISION?<details><summary>Insula guided sequence · separate draft</summary><p>{headInsulaLearningPacket().scope}</p><p>Sequence packet <code>{learningRevision}</code>. No saved approval or completion.</p>{headInsulaLearningPacket().sequences.map(sequence=><ol key={sequence.id} id={'head-guided-sequence-'+sequence.id}>{sequence.concepts.map(conceptId=>{
        const links=headLearningLinks({sequenceId:sequence.id,conceptId});
        return links?<li key={conceptId}>{conceptId}: <a href={links.atlasHref}>Inspect 3D step</a> · <a href={links.ctHref}>Inspect CT step</a> · <a href={links.mriHref}>Inspect MRI step</a></li>:null;
      })}</ol>)}</details>:<p>Insula guided sequence is unavailable or changed; other evidence remains separate.</p>}
      {packet.items.map(item=><details key={item.conceptId} id={'head-insula-comparison-'+item.conceptId}>
        <summary>{item.binding!.label} · CT mask / partial MRI mask</summary>
        <p>{item.binding!.scopeNote}</p>
        <p><HeadReviewImageLink conceptId={item.conceptId} modality="CT" revision={packet.headRevision}>Inspect {item.binding!.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}>Inspect {item.binding!.label} in MRI</HeadReviewImageLink> · <a href={item.binding!.atlasHref}>Inspect {item.binding!.label} in existing 3D Atlas</a></p>
        {teachingRevision===HEAD_INSULA_TEACHING_REVISION&&<><h3>{item.binding!.label} · CT teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="CT" revision={packet.headRevision}/><h3>{item.binding!.label} · MRI teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}/></>}
        <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd>
          <dt>Native CT ID</dt><dd><code>{item.ct.id}</code></dd><dt>Native MRI ID</dt><dd><code>{item.mri.id}</code></dd>
          <dt>Raw source label</dt><dd>{item.ct.label}</dd><dt>Laterality</dt><dd>{item.ct.laterality}</dd>
          <dt>CT representation</dt><dd>{item.ct.representation}</dd><dt>MRI representation</dt><dd>{item.mri.representation}</dd>
          <dt>Generic parent ID</dt><dd><code>{item.atlas.parentId}</code></dd><dt>Parent source SHA-256</dt><dd><code>{item.atlas.parentSource}</code></dd>
          <dt>Generic part ID</dt><dd><code>{item.atlas.partId}</code></dd><dt>Cerebral part source SHA-256</dt><dd><code>{item.atlas.partSource}</code></dd>
        </dl>
        <HeadPairedDecisionPanel key={packet.headRevision+item.conceptId} manifestRevision={packet.headRevision} conceptId={item.conceptId} label={item.binding!.label}/>
      </details>)}
    </details>}
  </section>;
}
