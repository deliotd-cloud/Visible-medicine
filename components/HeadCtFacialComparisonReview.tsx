import {HEAD_CT_FACIAL_COMPARISON_REVISION,type HeadCtFacialComparisonPacket} from '../lib/head-ct-facial-comparison-review';
import {HeadCtBoneDecisionPanel} from './HeadCtBoneDecisionPanel';
import {HeadReviewImageLink} from './HeadReviewImageLink';

/** Independent, collapsed evidence; private forms remain explicit and lazy. */
export function HeadCtFacialComparisonReview({packet}:{packet:HeadCtFacialComparisonPacket|null}){
  return <section id="ct-facial-bone-comparisons" className="head-mri-comparison" aria-label="CT-only facial bone comparison review">
    {!packet?<p role="alert">Facial bone comparison evidence is unavailable for this source revision. No target was substituted.</p>:<details>
      <summary>CT-only facial bones · {packet.items.length} independent draft bindings</summary>
      <p>{packet.scope}</p>
      <dl><dt>Independent comparison packet SHA-256</dt><dd><code>{HEAD_CT_FACIAL_COMPARISON_REVISION}</code></dd>
        <dt>Head manifest SHA-256</dt><dd><code>{packet.headRevision}</code></dd></dl>
      <ol>{packet.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {packet.items.map(item=><details key={item.conceptId} id={'head-ct-bone-comparison-'+item.conceptId}>
        <summary>{item.binding!.label} · CT-only semantic comparison</summary>
        <p>{item.binding!.scopeNote}</p>
        <p><HeadReviewImageLink conceptId={item.conceptId} modality="CT" revision={packet.headRevision}>Inspect {item.binding!.label} in CT</HeadReviewImageLink>
          {' · '}<a href={item.binding!.atlasHref}>Inspect {item.binding!.label} in existing 3D Atlas</a></p>
        <dl><dt>Concept ID</dt><dd><code>{item.conceptId}</code></dd>
          <dt>Native CT ID</dt><dd><code>{item.ct.id}</code></dd><dt>Exact raw label</dt><dd>{item.ct.label}</dd>
          <dt>CT side and representation</dt><dd>{item.ct.laterality} · {item.ct.representation}</dd>
          <dt>Generic bone ID</dt><dd><code>{item.atlas.structureId}</code></dd>
          <dt>Generic source SHA-256</dt><dd><code>{item.atlas.sourceHash}</code></dd></dl>
        <p>Comparison review only. No new teaching or guided sequence is included or approved by this decision.</p>
        <HeadCtBoneDecisionPanel key={packet.headRevision+HEAD_CT_FACIAL_COMPARISON_REVISION+item.conceptId}
          manifestRevision={packet.headRevision} conceptId={item.conceptId} label={item.binding!.label}/>
      </details>)}
    </details>}
  </section>;
}
