import Link from 'next/link';
import { Brand } from '../../../brand';
import { originalPlexusStudy } from '@/lib/original-plexus';
import { OriginalPlexusViewer } from './viewer';
import './viewer.css';

export const metadata = { title: 'Original plexus diagram — review candidate | Visible Medicine' };
export default function OriginalPlexusPage() {
  return <main className="plexus-candidate">
    <header className="plexus-heading"><Brand surface="light"/><Link href="/review/overview">Clinical review</Link></header>
    <div className="plexus-title"><div><p className="plexus-eyebrow">Original diagram · right side · review candidate</p><h1>Brachial plexus</h1></div><span className="plexus-status">Not clinically approved</span></div>
    <p className="plexus-notice">A typical C5–T1 connectivity diagram in 3D. Illustrative spacing, depth and calibre—not measured anatomy or a registered scan. This candidate is not in the learner atlas; no approval is saved here.</p>
    <OriginalPlexusViewer/>
    <details className="plexus-provenance"><summary>Provenance, omissions and review requirements</summary>
      <p>Original procedural curves and interface, authored for Visible Medicine under its MIT licence. No donor mesh, source illustration, texture, scan or new dependency is used.</p>
      <ul>{originalPlexusStudy.limitations.map(text => <li key={text}>{text}</li>)}</ul>
      <p>Radiologist review must assess each named connection, laterality, omitted variants, diagram clarity and the exact geometry/content revision. A factual connectivity check does not validate nerve trajectories or imaging correspondence.</p>
      <p>Consulted for facts only; no figures or visual layouts copied:</p>
      <ul>{originalPlexusStudy.references.map(ref => <li key={ref.id}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></li>)}</ul>
    </details>
  </main>;
}
