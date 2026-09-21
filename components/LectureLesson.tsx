import Link from "next/link";
import type { AuthContext } from "@/lib/auth";
import { getPublishedLecture, LectureError } from "@/lib/lecture-repository";
import { WorkspaceContextBar } from "@/components/SiteFrame";
import { LecturePlayer } from "@/components/LecturePlayer";

export async function LectureLesson({auth,workbookId,courseSlug}:{auth:AuthContext;workbookId:string;courseSlug?:string}) {
  let publication;
  try { publication=await getPublishedLecture(auth,workbookId,courseSlug); }
  catch(error) {
    if(!(error instanceof LectureError)) throw error;
    return <><WorkspaceContextBar pathname="/my-learning" signedIn={true} /><main className="inner-page"><h1>Lecture unavailable</h1><p>{error.message}</p><Link href="/my-learning">Return to My learning</Link></main></>;
  }
  const {manifest}=publication;
  return <><WorkspaceContextBar pathname="/my-learning" signedIn={true} /><div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting or patient care.</p></div><main className="inner-page"><p><Link href="/my-learning">← My learning</Link></p><LecturePlayer title={manifest.workbook.title} slides={manifest.slides} version={manifest.workbook.version} /><p className="form-help">Published lecture · course access is separate from Atlas access. Source links may have their own access requirements.</p></main></>;
}
