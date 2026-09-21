import type { Metadata } from "next";
import { EducationRuntime } from "@/components/EducationRuntime";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import "../../runtime.css";
import { ensureEducationUser } from "@/db/bootstrap";
import { isLectureWorkbook } from "@/lib/lecture-repository";
import { LectureLesson } from "@/components/LectureLesson";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course workspace", description: "Visible Medicine course-specific imaging workspace.", robots: { index: false, follow: false } };

export default async function CourseLearningPage({ params }: { params: Promise<{ courseSlug: string; workbookId: string }> }) {
  const { courseSlug, workbookId } = await params;
  const safeCourse = courseSlug.replace(/[^a-z0-9-]/g, "");
  const safeWorkbook = decodeURIComponent(workbookId).replace(/[^a-zA-Z0-9:_-]/g, "");
  const user=await requireChatGPTUser(`/learn/${safeCourse}/${encodeURIComponent(safeWorkbook)}`);
  const auth={userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName};
  await ensureEducationUser(auth);
  if(await isLectureWorkbook(safeWorkbook)) return <LectureLesson auth={auth} workbookId={safeWorkbook} courseSlug={safeCourse} />;
  return <EducationRuntime workbookId={safeWorkbook} />;
}
