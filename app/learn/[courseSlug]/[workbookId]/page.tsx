import type { Metadata } from "next";
import { EducationRuntime } from "@/components/EducationRuntime";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import "../../runtime.css";
import { ensureEducationUser } from "@/db/bootstrap";
import { isLectureWorkbook } from "@/lib/lecture-repository";
import { LectureLesson } from "@/components/LectureLesson";
import {lectureRequestReturnPath,parseLectureSlideRequest,type LectureSearchParams} from '@/lib/lecture-slide-navigation';
import {parseLectureTourContext} from '@/lib/lecture-tour-context';

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course workspace", description: "Visible Medicine course-specific imaging workspace.", robots: { index: false, follow: false } };

export default async function CourseLearningPage({ params,searchParams }: { params: Promise<{ courseSlug: string; workbookId: string }>;searchParams?:Promise<LectureSearchParams> }) {
  const { courseSlug, workbookId } = await params;
  const safeCourse = courseSlug.replace(/[^a-z0-9-]/g, "");
  const safeWorkbook = decodeURIComponent(workbookId).replace(/[^a-zA-Z0-9:_-]/g, "");
  const query=(await searchParams)??{},slideRequest=parseLectureSlideRequest(query),tourContext=parseLectureTourContext(query);
  const user=await requireChatGPTUser(lectureRequestReturnPath(safeWorkbook,safeCourse,slideRequest,tourContext));
  const auth={userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName};
  await ensureEducationUser(auth);
  if(await isLectureWorkbook(safeWorkbook)) return <LectureLesson auth={auth} workbookId={safeWorkbook} courseSlug={safeCourse} slideRequest={slideRequest} tourContext={tourContext} />;
  return <EducationRuntime workbookId={safeWorkbook} />;
}
