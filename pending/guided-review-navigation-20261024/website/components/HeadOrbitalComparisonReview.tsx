import {HEAD_ORBITAL_COMPARISON_REVISION,type HeadOrbitalComparisonPacket} from '../lib/head-orbital-comparison-review';
import {HEAD_ORBITAL_TEACHING_REVISION} from '../lib/head-orbital-teaching';
import {HeadAtlasTeaching} from './HeadAtlasTeaching';
import {HEAD_ORBITAL_LEARNING_REVISION,headOrbitalLearningPacket} from '../lib/head-orbital-learning';
import {headLearningLinks} from '../lib/head-atlas-learning';
import {HeadPairedDecisionPanel} from './HeadPairedDecisionPanel';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** The authorized server route supplies separately verified evidence. */
export function HeadOrbitalComparisonReview({packet,teachingRevision,learningRevision}:{packet:HeadOrbitalComparisonPacket|null;teachingRevision?:string|null;learningRevision?:string|null}){
  return <section id="orbital-comparisons" className="head-mri-comparison" aria-label="Globe comparison review">
    {!packet?<><h2>Globe comparisons unavailable</h2><p role="alert">The exact source or comparison packet changed. No targets have been substituted.</p></>:<details>
      <summary>Globe comparisons · {packet.items.length} draft bindings</summary>
      <p>{packet.scope}</p>
      <p>Open an individual comparison to inspect CT, MRI and 3D, then record your private review. Teaching and guided learning remain separate review items.</p>
      {teachingRevision===HEAD_ORBITAL_TEACHING_REVISION?<p>Separate globe teaching draft <code>{teachingRevision}</code>. The notes below have no recorded approval.</p>:<p>Globe teaching is unavailable or changed. Comparison evidence remains separate.</p>}
      <dl><dt>Comparison packet SHA-256</dt><dd><code>{HEAD_ORBITAL_COMPARISON_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      <h3>Comparison checklist</h3><ol>{packet.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {learningRevision===HEAD_ORBITAL_LEARNING_REVISION?<details><summary>Globe guided sequence · separate draft</summary><p>{headOrbitalLearningPacket().scope}</p><p>Sequence packet <code>{learningRevision}</code>. No saved approval or completion.</p>{headOrbitalLearningPacket().sequences.map(sequence=><ol key={sequence.id} id={'head-guided-sequence-'+sequence.id}>{sequence.concepts.map(conceptId=>{
        const links=headLearningLinks({sequenceId:sequence.id,conceptId});
        return links?<li key={conceptId}>{conceptId}: <a href={links.atlasHref}>Inspect 3D step</a> · <a href={links.ctHref}>Inspect CT step</a> · <a href={links.mriHref}>Inspect MRI step</a></li>:null;
      })}</ol>)}</details>:<p>Globe guided sequence is unavailable or changed; other evidence remains separate.</p>}
      {packet.items.map(item=><details key={item.conceptId} id={'head-orbital-comparison-'+item.conceptId}>
        <summary>{item.binding!.label} · CT mask / partial MRI mask</summary>
        <p>{item.binding!.scopeNote}</p>
        {teachingRevision===HEAD_ORBITAL_TEACHING_REVISION&&<><h3>{item.binding!.label} · CT teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="CT" revision={packet.headRevision}/><h3>{item.binding!.label} · MRI teaching</h3><HeadAtlasTeaching conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}/></>}
        <p><HeadReviewImageLink conceptId={item.conceptId} modality="CT" revision={packet.headRevision}>Inspect {item.binding!.label} in CT</HeadReviewImageLink> · <HeadReviewImageLink conceptId={item.conceptId} modality="MRI" revision={packet.headRevision}>Inspect {item.binding!.label} in MRI</HeadReviewImageLink> · <a href={item.binding!.atlasHref}>Inspect {item.binding!.label} in existing 3D Atlas</a></p>
        <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd>
          <dt>Native CT ID</dt><dd><code>{item.ct.id}</code></dd><dt>Native MRI ID</dt><dd><code>{item.mri.id}</code></dd>
          <dt>Raw source label</dt><dd>{item.ct.label}</dd><dt>Laterality</dt><dd>{item.ct.laterality}</dd>
          <dt>CT representation</dt><dd>{item.ct.representation}</dd><dt>MRI representation</dt><dd>{item.mri.representation}</dd>
          <dt>Generic eyeball ID</dt><dd><code>{item.atlas.structureId}</code></dd><dt>Generic source SHA-256</dt><dd><code>{item.atlas.sourceHash}</code></dd>
        </dl>
        <HeadPairedDecisionPanel key={packet.headRevision+item.conceptId} manifestRevision={packet.headRevision} conceptId={item.conceptId} label={item.binding!.label}/>
      </details>)}
    </details>}
  </section>;
}
