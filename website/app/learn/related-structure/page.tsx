import type {Metadata} from 'next';
import Link from 'next/link';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {bodyRelatedLectureHref,parseBodyRelatedLectureRequest,BODY_RELATED_LECTURE_PAGE_SIZE} from '@/lib/lecture-body-related-links';
import {resolveLectureBodyReference} from '@/lib/lecture-body-reference';
import {bodyStructureGuides} from '@/lib/body-structure-guides';
import {getRelatedPublishedBodyLectures} from '@/lib/lecture-body-related-repository';
import type {RelatedPublishedLectures} from '@/lib/lecture-related-repository';
import '../related-anatomy/related-anatomy.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Structure learning',robots:{index:false,follow:false}};
export default async function BodyStructureLearning({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){
  const request=parseBodyRelatedLectureRequest((await searchParams)??{});
  const user=await requireChatGPTUser(request?bodyRelatedLectureHref(request.reference,request.offset)!:'/learn/related-structure?invalid=1');
  const body=request?resolveLectureBodyReference(request.reference):null;
  if(!request||!body)return <main className="inner-page learning-page related-lectures-page"><section className="learning-heading"><div><p className="eyebrow">Structure learning</p><h1>Structure link unavailable.</h1><p>The exact 3D source is invalid or has changed. No newer structure or source has been substituted.</p><Link href="/search?kind=anatomy">Find a structure</Link></div></section></main>;
  let result:RelatedPublishedLectures={items:[],nextOffset:null},failed=false;
  try{result=await getRelatedPublishedBodyLectures({userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName},request);}catch{failed=true;}
  const self=bodyRelatedLectureHref(request.reference,request.offset)!;
  const previous=request.offset>=BODY_RELATED_LECTURE_PAGE_SIZE?bodyRelatedLectureHref(request.reference,request.offset-BODY_RELATED_LECTURE_PAGE_SIZE):null;
  const next=result.nextOffset===null?null:bodyRelatedLectureHref(request.reference,result.nextOffset);
  const guides=bodyStructureGuides(request.reference);
  return <main className="inner-page learning-page related-lectures-page">
    <section className="learning-heading"><div><p className="eyebrow">Structure learning</p><h1>{body.label}</h1><p>Explore the exact 3D reference, then open linked lecture slides included in your own course access.</p></div></section>
    <nav className="learning-subnav" aria-label="Return to anatomy or learning"><Link href="/search?kind=anatomy">Find another structure</Link><Link href="/my-learning">My learning</Link></nav>
    <section className="structure-learning-views" aria-labelledby="body-reference-title"><div className="section-heading compact"><h2 id="body-reference-title">Start with the structure</h2></div><nav className="structure-view-list" aria-label="Anatomy reference views"><Link className="structure-view-link" data-primary href={body.atlasHref}><strong>3D anatomy<span aria-hidden="true">→</span></strong><span>Open this exact source-bound structure in the existing Atlas.</span></Link></nav><p className="structure-view-boundary">This is a 3D anatomical reference only. No CT, MRI, X-ray or ultrasound match has been inferred.</p>
      {guides.length>0&&<details className="structure-learning-guides"><summary>Guided learning · Draft</summary>
        <p>Open a related tour at this structure, then use its playback controls. Each tour opens in the region shown.</p>
        <ol>{guides.map(guide=><li key={guide.id}><div><strong>{guide.label}</strong><span>{guide.regionLabel} · Step {guide.step} of {guide.total}</span></div><nav aria-label={`${guide.label} at ${body.label}`}><Link prefetch={false} href={guide.href} aria-label={`3D Atlas: ${guide.label}, ${guide.regionLabel}, step ${guide.step} of ${guide.total}`}>Open step {guide.step} in 3D Atlas</Link></nav></li>)}</ol>
      </details>}
    </section>
    <section className="learning-grid"><div className="learning-main"><div className="section-heading compact"><div><p className="section-index">Lecture slides</p><h2>Learn this in context</h2><p>Only published, explicitly linked slides included in your current course access appear.</p></div></div>
      {failed?<div role="status" className="empty-learning"><h3>Related lectures could not be loaded.</h3><p>Access could not be checked. No lecture details are shown.</p><Link href={self}>Try again</Link></div>
        :result.items.length?<div className="enrolled-course-grid">{result.items.map(item=><article className="related-lecture-card" key={item.workbookId}><div className="course-card-copy"><span>Published edition {item.version}</span><h3>{item.title}</h3><ol>{item.slides.map(slide=><li key={slide.id}><Link href={slide.href}>{slide.title}</Link></li>)}</ol></div></article>)}</div>
        :<div className="empty-learning"><h3>No accessible linked slides in this group.</h3><p>{next?'Other allocated lectures may have matching slides. Continue to the next group.':'An educator can add this exact 3D structure in Studio, then use the existing independent review and publication process.'}</p></div>}
      {(previous||next)&&<nav className="learning-subnav" aria-label="Related lecture groups">{previous&&<Link href={previous}>Previous group</Link>}{next&&<Link href={next}>More allocated lectures</Link>}</nav>}
    </div></section>
    <details className="structure-learning-provenance"><summary>Source &amp; access</summary><p>{body.scopeNote}</p><p>Atlas, case and paid lecture permissions remain independent. Publication and working links are not clinical approval or patient-space registration.</p><p>Atlas source revision: <code>{body.atlasRevision}</code></p><p>Each slide link names its published edition; playback rechecks your access. No draft titles or unavailable lecture details are disclosed.</p></details>
  </main>;
}
