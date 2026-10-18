import {notFound} from 'next/navigation';
import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {regionalMriReviewSource} from '@/lib/regional-mri-review-source';
import {buildRegionalMri3dCatalogue} from '@/lib/regional-mri-3d-catalogue';
import {parseRegionalLearningReviewRequest} from '@/lib/regional-mri-learning-review-link';
import {resolveRegionalLearningReview} from '@/lib/regional-mri-learning-review';
import {regionalReferenceDraftContext} from '@/lib/regional-reference-draft-contract';
import {RegionalReferenceReviewNotes} from '@/components/RegionalReferenceReviewNotes';
import {buildRegionalReferenceReviewIndex} from '@/lib/regional-reference-review-index';
import {RegionalReferenceReviewCatalogue} from '@/components/RegionalReferenceReviewCatalogue';

export const dynamic='force-dynamic';
export const metadata={title:'Regional reference teaching · Clinical Review',robots:{index:false,follow:false}};

export default async function RegionalReferenceLearningReviewPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 try{await authorizeClinicalReview();}
 catch{return <p role="alert">Open Clinical Review with an authorized administrator account to inspect this teaching draft.</p>;}
 const params=await searchParams;
 const browse=!!params&&typeof params==='object'&&!Array.isArray(params)&&Object.keys(params).length===0;
 const request=browse?null:parseRegionalLearningReviewRequest(params);
 if(!browse&&!request)notFound();
 const source=regionalMriReviewSource();
 const catalogue=source?await buildRegionalMri3dCatalogue(source):null;
 if(browse){
  const index=await buildRegionalReferenceReviewIndex(catalogue);
  return <main className="review-workspace">
   <p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a> · <a href="/workspace/atlas-review/regional-mri">Regional MRI inspection</a></p>
   <h1>Reference teaching drafts</h1>
   <p>Find the exact general-reference teaching and private correction pages without opening a scan first. These are separate anatomical references, not MRI findings, approved correspondences or registered patient anatomy.</p>
   {index?<RegionalReferenceReviewCatalogue key={`${index.atlasRevision}:${index.mappingRevision}`} index={index}/>:<p role="status">No current source-bound reference teaching catalogue is available. An older or substitute catalogue is not shown.</p>}
  </main>;
 }
 if(!request)notFound();
 const snapshot=await resolveRegionalLearningReview(request,catalogue);
 if(!snapshot)notFound();
 const {entry}=snapshot;
 return <main className="review-workspace">
  <p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a> · <a href="/workspace/atlas-review/reference-learning">Teaching draft catalogue</a> · <a href="/workspace/atlas-review/regional-mri">Regional MRI inspection</a></p>
  <h1>{entry.target.label}</h1>
  <p>Read-only draft general reference teaching. This page does not carry the scan identity. This is not a scan finding, anatomical correspondence, registration, clinical approval, or learner publication. Existing worksheet decisions do not approve this projected snapshot.</p>
  <p>Reference relationship: {entry.target.relation==='parent-reference'?'Whole parent reference':entry.target.relation==='group-reference'?'Grouped reference':'Same anatomical structure reference'}. Source side: {entry.target.side}. The reference may be a parent, group, or opposite-side source; it does not establish a match to the scan.</p>
  <details aria-label="Revision binding"><summary>Exact source and draft revisions</summary>
   <p>Public Atlas revision: <code>{snapshot.atlasRevision}</code></p>
   <p>Public mapping revision: <code>{snapshot.mappingRevision}</code></p>
   <p>Teaching draft revision: <code>{entry.revision}</code></p>
  </details>
  <RegionalReferenceReviewNotes context={regionalReferenceDraftContext(snapshot)}/>
  <section aria-label="Reference teaching topics"><h2>Reference teaching</h2>
   {entry.topics.map(topic=><section key={topic.id} aria-label={topic.title}>
    <h3>{topic.title}</h3><p>Readiness: {topic.readiness}</p><p>{topic.body}</p>
    {topic.bullets.length>0&&<ul>{topic.bullets.map((point,i)=><li key={i}>{point}</li>)}</ul>}
    {topic.note&&<p>{topic.note}</p>}
    {topic.references.length>0&&<details><summary>Sources · {topic.references.length}</summary><ul>
     {topic.references.map((reference,i)=><li key={i}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></li>)}
    </ul></details>}
   </section>)}
  </section>
  <section aria-label="Reference limitations"><h2>Limitations</h2>
   {entry.limitations.length>0?<ul>{entry.limitations.map((item,i)=><li key={i}>{item}</li>)}</ul>:<p>No additional source-authored limitation is attached to this draft; the relationship and scan boundaries above still apply.</p>}
  </section>
  {entry.reflection&&<details><summary>Source-authored reflection</summary>
   <p>{entry.reflection.question}</p><details><summary>Show source-authored answer</summary><p>{entry.reflection.answer}</p></details>
   {entry.reflection.references.length>0&&<ul>{entry.reflection.references.map((reference,i)=><li key={i}>
    <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a></li>)}</ul>}
  </details>}
 </main>;
}
