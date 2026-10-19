import {headCtBoneLearningPacket,verifiedHeadCtBoneLearningRevision} from '../lib/head-ct-bone-learning';
import {headLearningLinks} from '../lib/head-atlas-learning';

/** Server-only evidence, behind the existing Clinical Review authorization gate. */
export async function HeadCtBoneLearningReview({manifestRevision}:{manifestRevision:string}){
  const revision=await verifiedHeadCtBoneLearningRevision(manifestRevision);
  if(!revision)return <p role="alert">CT bone tour evidence is unavailable because its exact source or sequence changed.</p>;
  const packet=headCtBoneLearningPacket();
  return <details><summary>CT-only guided learning · 2 draft sequences</summary>
    <p>{packet.scope}</p><p>Review the order and each partial-mask comparison independently. The comparison forms below do not record tour approval.</p>
    <dl><dt>Sequence packet SHA-256</dt><dd><code>{revision}</code></dd><dt>Comparison packet SHA-256</dt><dd><code>{packet.comparisonRevision}</code></dd></dl>
    {packet.sequences.map(sequence=><section key={sequence.id}><h3>{sequence.label}</h3><ol>{sequence.concepts.map((conceptId,index)=>{
      const links=headLearningLinks({sequenceId:sequence.id,conceptId}),binding=sequence.bindings[index];
      return links&&binding?<li key={conceptId}>{binding.label} · <a href={links.ctHref}>Inspect CT step</a> · <a href={links.atlasHref}>Inspect 3D step</a></li>:null;
    })}</ol></section>)}
  </details>;
}
