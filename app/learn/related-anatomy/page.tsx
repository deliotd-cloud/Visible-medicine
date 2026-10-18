import type {Metadata} from 'next';
import Link from 'next/link';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {getRelatedPublishedLectures,type RelatedPublishedLectures} from '@/lib/lecture-related-repository';
import {parseRelatedLectureRequest,relatedLectureConcept,relatedLectureHref,RELATED_LECTURE_PAGE_SIZE} from '@/lib/lecture-related-links';
import type {LectureSearchParams} from '@/lib/lecture-slide-navigation';
import {headImageHref} from '@/lib/head-atlas-navigation';
import {headLearningLinks} from '@/lib/head-atlas-learning';
import {appendLectureTourContext,lectureTourReturn} from '@/lib/lecture-tour-context';
import './related-anatomy.css';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Related anatomy lectures',robots:{index:false,follow:false}};

export default async function RelatedAnatomyPage({searchParams}:{searchParams?:Promise<LectureSearchParams>}){
  const request=parseRelatedLectureRequest((await searchParams)??{});
  // Deliberately require the real learner session, including in local preview.
  // A demo fallback or Atlas subscription cannot grant paid lecture access.
  const user=await requireChatGPTUser(request?relatedLectureHref(request.conceptId,request.headRevision,request.offset,request.tourContext)!:'/learn/related-anatomy?invalid=1');
  const concept=request?relatedLectureConcept(request):null;
  if(!request||!concept)return <main className="inner-page learning-page related-lectures-page">
    <section className="learning-heading"><div><p className="eyebrow">Related learning</p><h1>Structure link unavailable.</h1>
      <p>This link is invalid or its anatomy source has changed. Return to the Atlas and choose the structure again; no newer source has been substituted.</p>
      <Link href="/my-learning">My learning</Link></div></section>
  </main>;

  let result:RelatedPublishedLectures={items:[],nextOffset:null};
  let failed=false;
  try{result=await getRelatedPublishedLectures({userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName},request);}
  catch{failed=true;}
  const previous=request.offset>=RELATED_LECTURE_PAGE_SIZE?relatedLectureHref(request.conceptId,request.headRevision,request.offset-RELATED_LECTURE_PAGE_SIZE,request.tourContext):null;
  const next=result.nextOffset===null?null:relatedLectureHref(request.conceptId,request.headRevision,result.nextOffset,request.tourContext);
  const position=request.tourContext?.kind==='ready'?{sequenceId:request.tourContext.sequenceId,conceptId:request.tourContext.conceptId}:null;
  const tourReturn=lectureTourReturn(request.tourContext);
  const atlasHref=position?headLearningLinks(position)?.atlasHref:concept.atlasHref;
  const ctHref=headImageHref('CT',concept.conceptId,position,concept.headRevision);
  const mriHref=headImageHref('MRI',concept.conceptId,position,concept.headRevision);
  return <main className="inner-page learning-page related-lectures-page">
    <section className="learning-heading"><div><p className="eyebrow">Related learning</p><h1>{concept.label}</h1>
      <p>Published lecture slides linked to this exact anatomy source. Only lectures available with your current course access appear.</p>
    </div></section>
    <nav className="learning-subnav" aria-label="Return to anatomy or learning">
      <Link href="/my-learning">My learning</Link>
      {tourReturn&&<Link href={tourReturn.href}>Return to {tourReturn.label} · step {tourReturn.step} · {tourReturn.view}</Link>}
      {ctHref&&<Link href={ctHref}>CT anatomy</Link>}
      {mriHref&&<Link href={mriHref}>MRI anatomy</Link>}
      {atlasHref&&<Link href={atlasHref}>3D anatomy</Link>}
    </nav>
    <section className="learning-grid">
      <div className="learning-main">
        <div className="section-heading compact"><div><p className="section-index">Lecture slides</p><h2>Learn this in context</h2></div></div>
        {failed?<div role="status" className="empty-learning"><h3>Related lectures could not be loaded.</h3>
          <p>Access could not be checked. Try again or return to My learning.</p>
          <Link href={relatedLectureHref(request.conceptId,request.headRevision,request.offset,request.tourContext)!}>Try again</Link></div>
        :result.items.length?<div className="enrolled-course-grid">{result.items.map(item=><article className="related-lecture-card" key={item.workbookId}>
          <div className="course-card-copy"><span>Published edition {item.version}</span><h3>{item.title}</h3>
            <ol>{item.slides.map(slide=>{const href=appendLectureTourContext(slide.href,request.tourContext);return href?<li key={slide.id}><Link href={href}>{slide.title}</Link></li>:null;})}</ol>
          </div>
        </article>)}</div>:<div className="empty-learning"><h3>No accessible linked slides in this group.</h3>
          <p>{next?'Other allocated lectures may have matching slides. Continue to the next group.':'Only published, explicitly linked slides with current access are shown. An educator can add a structure link in Studio and publish it through the existing review process.'}</p></div>}
        {(previous||next)&&<nav className="learning-subnav" aria-label="Related lecture groups">
          {previous&&<Link href={previous}>Previous group</Link>}{next&&<Link href={next}>More allocated lectures</Link>}
        </nav>}
      </div>
      <aside className="learning-aside"><p className="section-index">Linked learning</p><h2>Separate access. Exact links.</h2>
        <p>When opened from the Atlas, its original tab is preserved. Each slide link names its published edition; playback checks your access again.</p>
        <p>Atlas, case and paid lecture permissions remain independent. No draft slides or unavailable lecture details are listed.</p>
        <details><summary>Comparison limits</summary><p>These are semantic structure links, not validated patient-space registration. CT and MRI are separate, unregistered subjects.</p></details>
      </aside>
    </section>
  </main>;
}
