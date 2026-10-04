import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {validatePlexusReviewContext} from '@/lib/plexus-review-decisions';
import {PlexusReviewWorksheet} from '@/components/PlexusReviewWorksheet';
import packet from '@/lib/plexus-review-manifest.json';
export const dynamic='force-dynamic';
export const metadata={title:'Original plexus schematic · Clinical Review',robots:{index:false,follow:false}};
export default async function PlexusReviewPage(){
  try{await authorizeClinicalReview();}catch{return <p role="alert">Sign in with an authorized Clinical Review administrator account to inspect this candidate.</p>;}
  const context=validatePlexusReviewContext(packet.context),study=packet.study;
  const name=(key:string)=>study.parts.find(p=>p.key===key)?.name??key;
  return <main className="review-workspace">
    <a href="/workspace/atlas-review/source-comparisons">← Source comparisons</a>
    <h1>Original brachial plexus schematic</h1>
    <p>Private candidate review · right typical C5–T1 · 35 named parts and 38 connections. Inspect the diagram, then record topology and presentation separately below.</p>
    <p role="note">This is original MIT-authored diagrammatic geometry, not an acquired or spatially validated nerve mesh. A saved review does not admit it to the learner atlas, validate CT/MRI registration or grant institutional sign-off.</p>
    <iframe title="Private original brachial plexus schematic — diagrammatic, not to scale" className="review-model-frame" src={'/api/atlas-review/source-comparisons/plexus/index.html?revision='+context.materialHash}/>
    <details><summary>Complete named anatomy, connections, references and limitations</summary>
      <h2>Named parts</h2><ul>{study.parts.map(p=><li key={p.id}><strong>{p.name}</strong> — {p.summary} <code>{p.id}</code></li>)}</ul>
      <h2>Named connections</h2><table><thead><tr><th>From</th><th>To</th></tr></thead><tbody>{study.connections.map(edge=><tr key={edge.from+':'+edge.to}><td>{name(edge.from)}</td><td>{name(edge.to)}</td></tr>)}</tbody></table>
      <h2>Limits</h2><ul>{study.limitations.map(limit=><li key={limit}>{limit}</li>)}</ul>
      <h2>References</h2><ul>{study.references.map(ref=><li key={ref.id}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></li>)}</ul>
      <p>Source <code>{context.sourceCommit}</code>; material <code>{context.materialHash}</code>. These are revision identities, not evidence of clinical acceptance.</p>
    </details>
    <PlexusReviewWorksheet context={context}/>
  </main>;
}
