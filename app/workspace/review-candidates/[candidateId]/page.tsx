import Link from 'next/link';
import {notFound} from 'next/navigation';
import registry from '@/lib/clinical-review-candidate-registry.json';
import {resolveCandidate} from '@/lib/clinical-review-candidate';
import {validateFrozenComparisonPair,type FrozenComparisonPair} from '@/lib/frozen-candidate-comparison';
import {FrozenCandidateComparison} from '@/components/FrozenCandidateComparison';
export const dynamic='force-dynamic';
export const metadata={title:'Frozen inspection · Clinical Review',robots:{index:false,follow:false}};
export default async function SavedInspection({params}:{params:Promise<{candidateId:string}>}){
  const {candidateId}=await params;
  const candidate=await resolveCandidate(registry,candidateId);
  if(!candidate)notFound();
  let comparison:FrozenComparisonPair|null=null;
  let comparisonUnavailable=false;
  if(candidate.decisionMode==='personal-review'&&candidate.supersedes){
    try{
      const previous=await resolveCandidate(registry,candidate.supersedes);
      if(!previous)throw Error('Saved predecessor unavailable.');
      comparison=await validateFrozenComparisonPair(candidate,previous);
    }catch{comparisonUnavailable=true;}
  }
  return <section style={{padding:16}}><Link href="/workspace/review-candidates">← Saved inspections</Link>
    <h1>{candidate.label}</h1><p>Private frozen inspection · {candidate.decisionMode==='personal-review'?'personal review enabled':'read-only'} · no approval transferred</p>
    {candidate.decisionMode==='personal-review'&&candidate.supersedes&&<p>This is a new candidate. <Link href={`/workspace/review-candidates/${candidate.supersedes}`}>Inspect the earlier saved version</Link>. Its records are not transferred here.</p>}
    <details><summary>Exact candidate revision</summary><code style={{overflowWrap:'anywhere'}}>{candidate.id}</code><p>Source {candidate.atlasRevision} · originating Review {candidate.reviewRevision}</p><p>Saved renderer {candidate.rendererRevision}. The saved build has its own delivery adapter; it is not the current live renderer.</p></details>
    {comparison&&<FrozenCandidateComparison current={comparison.current} previous={comparison.previous}/>}
    {comparisonUnavailable&&<p role="status">The earlier saved material could not be matched for comparison. You can still inspect this saved version below.</p>}
    <iframe title={`${candidate.label} · saved worksheet and model`} src={`/api/atlas-review/candidates/${candidate.id}/assets/index.html`} allowFullScreen style={{display:'block',width:'100%',height:'82vh',minHeight:600,border:'1px solid #d6e1dc',borderRadius:8,marginTop:16}}/>
  </section>;
}
