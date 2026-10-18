import Link from 'next/link';
import registry from '@/lib/clinical-review-candidate-registry.json';
import {validateCandidate} from '@/lib/clinical-review-candidate';
export const dynamic='force-dynamic';
export const metadata={title:'Saved inspections · Clinical Review',robots:{index:false,follow:false}};
export default async function SavedInspections(){
  const candidates=await Promise.all(registry.map(value=>validateCandidate(value)));
  return <section style={{maxWidth:1000,margin:'24px auto',padding:20}}>
    <Link href="/workspace/atlas-review">← Clinical Review</Link><h1>Saved inspections</h1>
    <p>Inspect a frozen worksheet and its saved 3D renderer while development continues. Review-enabled candidates can record your personal decisions and correction history; inspection-only candidates remain read-only.</p>
    <p>Records apply only to the exact candidate and your authorized account/institution. They do not transfer to later versions or authorize publication or patient-space registration.</p>
    {candidates.length?<ul>{[...candidates].reverse().map(item=><li key={item.id} style={{marginBlock:20}}><Link href={`/workspace/review-candidates/${item.id}`}>{item.label}</Link><p>{item.decisionMode==='personal-review'?'Review enabled':'Read-only inspection'} · {item.selections.length} saved structures · source {item.atlasRevision.slice(0,12)} · {new Date(item.createdAt).toLocaleDateString('en-GB',{timeZone:'UTC'})}</p>{item.decisionMode==='personal-review'&&item.supersedes&&<p>New candidate replacing an earlier inspection; no approval inherited. <Link href={`/workspace/review-candidates/${item.supersedes}`}>Earlier candidate</Link></p>}</li>)}</ul>:<p>No inspection candidate is registered.</p>}
  </section>;
}
