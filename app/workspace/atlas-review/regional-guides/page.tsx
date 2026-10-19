import {notFound} from 'next/navigation';
import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {regionalGuideReviewPackets,parseRegionalGuideReviewSelection,resolveRegionalGuideReview,regionalGuideReviewHref} from '@/lib/regional-guide-review';
import {regionalGuideReviewContext} from '@/lib/regional-guide-review-contract';
import {RegionalGuideReviewNotes} from '@/components/RegionalGuideReviewNotes';

export const dynamic='force-dynamic';
export const metadata={title:'Native MRI guide teaching · Clinical Review',robots:{index:false,follow:false}};
export default async function RegionalGuideReviewPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 try{await authorizeClinicalReview();}catch{return <p role="alert">Open Clinical Review with an authorized administrator account to review guide teaching.</p>;}
 const params=await searchParams,browse=Object.keys(params).length===0;
 const selection=browse?null:parseRegionalGuideReviewSelection(params);if(!browse&&!selection)notFound();
 if(browse){const packets=await regionalGuideReviewPackets();return <main className="review-workspace">
  <p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a> · <a href="/workspace/atlas-review/regional-mri">Regional MRI inspection</a></p>
  <h1>Native MRI guide teaching</h1>
  <p>Review the wording, sources and limitations of each guided inspection. These personal decisions are separate from annotation acceptance, 3D correspondence, registration and learner release. No scan needs to be opened to read the authored teaching.</p>
  <ul>{packets.map(p=><li key={p.guideId}><a href={regionalGuideReviewHref(p)}>{p.title}</a> · {p.steps.length} steps · teaching decision</li>)}</ul>
 </main>;}
 if(!selection)notFound();const resolved=await resolveRegionalGuideReview(selection);
 // A known but stale URL holds the same client review owner read-only so a
 // soft source refresh cannot destroy its dirty copy by replacing it with404.
 const packet=resolved??(await regionalGuideReviewPackets()).find(p=>p.guideId===selection.guide);if(!packet)notFound();
 const stale=!resolved;
 return <main className="review-workspace">
  <p><a href="/workspace/clinical-review-inbox">← Clinical Review inbox</a> · <a href="/workspace/atlas-review/regional-guides">All native MRI guides</a> · <a href="/workspace/atlas-review/regional-mri">Inspect local MRI</a></p>
  <h1>{stale?'Guide revision changed':packet.title}</h1>
  <p>Decision scope: this exact guide’s teaching wording and references only. It does not approve any MRI annotation, scan finding, mask boundary, 3D match, patient-space registration, publication or clinical use. Source-scoped annotation acceptance does not approve this text.</p>
  <details><summary>Exact teaching revisions</summary>{stale?<p>Requested content revision: <code>{selection.revision}</code>. Current teaching is not substituted behind this old URL.</p>:<><p>Authoring revision: <code>{packet.guideRevision}</code></p><p>Full content revision: <code>{packet.contentRevision}</code></p></>}</details>
  <section aria-label="Exact guide teaching">{stale?<><h2>Current teaching withheld</h2><p role="alert">This exact revision is no longer current. Any retained working notes below are read-only; export them before leaving. A full reload cannot restore unsaved in-memory notes.</p><a href={regionalGuideReviewHref(packet)}>Open the current exact guide revision</a></>:<><h2>Ordered inspection steps</h2><ol>{packet.steps.map(s=><li key={s.anatomyId}><h3>{s.title}</h3><p>{s.caption}</p><p>Structure: <code>{s.anatomyId}</code></p><a href={s.source.href} target="_blank" rel="noopener noreferrer">{s.source.title} ↗</a></li>)}</ol></>}</section>
  <RegionalGuideReviewNotes context={regionalGuideReviewContext(packet)} externallyRetired={stale}/>
 </main>;
}
