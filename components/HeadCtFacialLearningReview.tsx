import {headCtFacialLearningPacket,verifiedHeadCtFacialLearningRevision} from '../lib/head-ct-facial-learning.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';

/** Inspection only; the parent route retains Clinical Review authorization. */
export async function HeadCtFacialLearningReview({manifestRevision}:{manifestRevision:string}){
  const revision=await verifiedHeadCtFacialLearningRevision(manifestRevision);
  if(!revision)return <p id="ct-facial-learning" role="alert">Facial guided sequence evidence is unavailable because its exact source or sequence changed.</p>;
  const packet=headCtFacialLearningPacket();
  return <details id="ct-facial-learning"><summary>Facial guided sequence · Draft · 3 steps</summary>
    <p>{packet.scope}</p>
    <p>Inspection only. Existing comparison decisions do not record approval of this sequence.</p>
    <dl><dt>Sequence packet SHA-256</dt><dd><code style={{overflowWrap:'anywhere'}}>{revision}</code></dd><dt>Comparison packet SHA-256</dt><dd><code style={{overflowWrap:'anywhere'}}>{packet.comparisonRevision}</code></dd></dl>
    {packet.sequences.map(sequence=><section key={sequence.id}><h3>{sequence.label}</h3><ol>{sequence.concepts.map((conceptId,index)=>{
      const binding=sequence.bindings[index],links=headLearningLinks({sequenceId:sequence.id,conceptId});
      return binding&&links?<li key={conceptId}>{binding.label} · <a href={links.ctHref}>Inspect CT step</a> · <a href={links.atlasHref}>Inspect 3D step</a></li>:null;
    })}</ol></section>)}
  </details>;
}
