import Link from "next/link";
import type { AuthContext } from "@/lib/auth";
import { getPublishedLecture, LectureError } from "@/lib/lecture-repository";
import { WorkspaceContextBar } from "@/components/SiteFrame";
import { LecturePlayer } from "@/components/LecturePlayer";
import type {LectureSlideRequest} from '@/lib/lecture-slide-navigation';
import {lectureTourReturn,type LectureTourContext} from '@/lib/lecture-tour-context';

export async function LectureLesson({auth,workbookId,courseSlug,slideRequest={kind:'none'},tourContext={kind:'none'}}:{auth:AuthContext;workbookId:string;courseSlug?:string;slideRequest?:LectureSlideRequest;tourContext?:LectureTourContext}) {
  const returnToTour=lectureTourReturn(tourContext);
  const tourNavigation={tourContext};
  const returnLink=returnToTour?<p><Link href={returnToTour.href}>← Return to {returnToTour.label} · step {returnToTour.step} / {returnToTour.total} · {returnToTour.view}</Link></p>:tourContext.kind==='invalid'?<p role="status">The guided learning return link is unavailable.</p>:null;
  let publication;
  try { publication=await getPublishedLecture(auth,workbookId,courseSlug); }
  catch(error) {
    if(!(error instanceof LectureError)) throw error;
    return <><WorkspaceContextBar pathname="/my-learning" signedIn={true} /><main className="inner-page"><h1>Lecture unavailable</h1><p>{error.message}</p>{returnLink}<Link href="/my-learning">Return to My learning</Link></main></>;
  }
  const {manifest}=publication;
  return <><WorkspaceContextBar pathname="/my-learning" signedIn={true} /><div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting or patient care.</p></div><main className="inner-page"><p><Link href="/my-learning">← My learning</Link></p>{returnLink}<LecturePlayer key={`${courseSlug??''}:${manifest.workbook.id}:${publication.integrityHash}:${JSON.stringify(slideRequest)}${tourContext.kind==='ready'&&returnToTour?`:${tourContext.sequenceId}:${tourContext.conceptId}:${tourContext.headRevision}:${tourContext.view}`:''}`} title={manifest.workbook.title} slides={manifest.slides} version={manifest.workbook.version} navigation={{workbookId:manifest.workbook.id,courseSlug,revision:publication.integrityHash,request:slideRequest,...tourNavigation}} /><p className="form-help">Published lecture · course access is separate from Atlas access. Source links may have their own access requirements.</p></main></>;
}
