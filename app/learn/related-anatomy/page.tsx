import type {Metadata} from 'next';
import Link from 'next/link';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {getRelatedPublishedLectures,type RelatedPublishedLectures} from '@/lib/lecture-related-repository';
import {parseRelatedLectureRequest,relatedLectureConcept,relatedLectureHref,RELATED_LECTURE_PAGE_SIZE} from '@/lib/lecture-related-links';
import type {LectureSearchParams} from '@/lib/lecture-slide-navigation';
import {headImageHref} from '@/lib/head-atlas-navigation';
import {headLearningLinks} from '@/lib/head-atlas-learning';
import {headStructureGuides} from '@/lib/head-structure-guides';
import {appendLectureTourContext,lectureTourReturn} from '@/lib/lecture-tour-context';
import './related-anatomy.css';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Structure learning',robots:{index:false,follow:false}};

export default async function RelatedAnatomyPage({searchParams}:{searchParams?:Promise<LectureSearchParams>}){
  const request=parseRelatedLectureRequest((await searchParams)??{});
  // Deliberately require the real learner session, including in local preview.
  // A demo fallback or Atlas subscription cannot grant paid lecture access.
  const user=await requireChatGPTUser(request?relatedLectureHref(request.conceptId,request.headRevision,request.offset,request.tourContext)!:'/learn/related-anatomy?invalid=1');
  const concept=request?relatedLectureConcept(request):null;
  if(!request||!concept)return <main className="inner-page learning-page related-lectures-page">
    <section className="learning-heading"><div><p className="eyebrow">Related learning</p><h1>Structure link unavailable.</h1>
      <p>This link is invalid or its anatomy source has changed. Return to the Atlas and choose the structure again; no newer source has been substituted.</p>
      <div className="structure-learning-recovery"><Link href="/atlas">Choose a structure in the Atlas</Link><Link href="/my-learning">My learning</Link></div></div></section>
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
  const guides=headStructureGuides(concept.conceptId,concept.headRevision);
  const views=[
    {key:'3d',label:'3D anatomy',description:'Explore this structure in the 3D Atlas.',href:atlasHref},
    {key:'ct',label:'CT anatomy',description:'Open the linked CT reference.',href:ctHref},
    {key:'mri',label:'MRI anatomy',description:'Open the linked MRI reference.',href:mriHref},
  ].filter((view):view is {key:string;label:string;description:string;href:string}=>typeof view.href==='string');
  return <main className="inner-page learning-page related-lectures-page">
    <section className="learning-heading"><div><p className="eyebrow">Structure learning</p><h1>{concept.label}</h1>
      <p>Choose an anatomy view, then open lecture slides you can access.</p>
    </div></section>
    <nav className="learning-subnav" aria-label="Return to anatomy or learning">
      <Link href="/my-learning">My learning</Link>
      {tourReturn&&<Link className="structure-guide-return" href={tourReturn.href}>Return to {tourReturn.label} · step {tourReturn.step} · {tourReturn.view}</Link>}
    </nav>
    <section className="structure-learning-views" aria-labelledby="structure-learning-views-title">
      <div className="section-heading compact"><div><p className="section-index">Anatomy</p><h2 id="structure-learning-views-title">Start with the structure</h2></div></div>
      {views.length?<nav className="structure-view-list" aria-label="Anatomy reference views">
        {views.map((view,index)=><Link className="structure-view-link" data-primary={!tourReturn&&index===0?true:undefined} href={view.href} key={view.key}>
          <strong>{view.label}<span aria-hidden="true">→</span></strong><span>{view.description}</span>
        </Link>)}
      </nav>:<p>No anatomy view is mapped for this exact source. No alternative source has been substituted.</p>}
      <p className="structure-view-boundary">These views show the same anatomical concept. CT and MRI show different subjects and are not aligned. The 3D view is not an image match.</p>
      {guides.length>0&&<details className="structure-learning-guides">
        <summary>Guided learning · Draft</summary>
        <p>Choose a view to open a draft tour at this step. Each view checks availability and access separately. These links do not record progress or align scans.</p>
        <ol>{guides.map(guide=><li key={guide.id}>
          <div><strong>{guide.label}</strong><span>Step {guide.step} of {guide.total}</span></div>
          <nav aria-label={`${guide.label} at ${concept.label}`}>
            {guide.views.map(view=><Link prefetch={false} key={view.key} href={view.href} aria-label={`${view.label}: ${guide.label}, step ${guide.step} of ${guide.total}`}>{view.label}</Link>)}
          </nav>
        </li>)}</ol>
      </details>}
    </section>
    <section className="learning-grid">
      <div className="learning-main">
        <div className="section-heading compact"><div><p className="section-index">Lecture slides</p><h2>Learn this in context</h2><p>Only published, linked slides from courses you can access appear.</p></div></div>
        {failed?<div role="status" className="empty-learning"><h3>Related lectures could not be loaded.</h3>
          <p>Access could not be checked. Try again or return to My learning.</p>
          <Link href={relatedLectureHref(request.conceptId,request.headRevision,request.offset,request.tourContext)!}>Try again</Link></div>
        :result.items.length?<div className="enrolled-course-grid">{result.items.map(item=><article className="related-lecture-card" key={item.workbookId}>
          <div className="course-card-copy"><span>Published edition {item.version}</span><h3>{item.title}</h3>
            <ol>{item.slides.map(slide=>{const href=appendLectureTourContext(slide.href,request.tourContext);return href?<li key={slide.id}><Link href={href}>{slide.title}</Link></li>:null;})}</ol>
          </div>
        </article>)}</div>:<div className="empty-learning"><h3>No lecture slides to show in this group.</h3>
          <p>{next?'There may be more linked slides in the next group.':'There are no published slides linked to this structure that you can open here.'}</p></div>}
        {(previous||next)&&<nav className="learning-subnav" aria-label="Related lecture groups">
          {previous&&<Link href={previous}>Previous group</Link>}{next&&<Link href={next}>Next group</Link>}
        </nav>}
      </div>
    </section>
    <details className="structure-learning-provenance"><summary>Source &amp; access</summary><div><h2>Separate access. Exact links.</h2>
        <p>When opened from the Atlas, its original tab is preserved. Each slide link names its published edition; playback checks your access again.</p>
        <p>Atlas, case and paid lecture permissions remain independent. Tour views check availability and access separately; opening a tour link does not record progress. No draft slides or unavailable lecture details are listed.</p>
        <p>These are semantic structure links, not validated patient-space registration. CT and MRI are separate, unregistered subjects. A working link is not clinical approval.</p>
        <p>{concept.scopeNote}</p>
        <p>Anatomy source revision: <code>{concept.headRevision}</code></p>
    </div></details>
  </main>;
}
