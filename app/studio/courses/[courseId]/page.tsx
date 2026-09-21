import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { StudioCourseEditor } from "@/components/StudioCourseEditor";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio course", robots: { index: false, follow: false } };

export default async function StudioCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const courseId = decodeURIComponent((await params).courseId);
  const user = await requireChatGPTUser(`/studio/courses/${encodeURIComponent(courseId)}`);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const course = snapshot.courses.find((item) => item.id === courseId); if (!course) notFound();
  const workbooks = snapshot.workbooks.filter((item) => item.courseId === course.id); const releases = snapshot.releases.filter((item) => item.courseId === course.id);
  return <StudioShell snapshot={snapshot} eyebrow={`${course.code} · Course`} title={course.title} description={course.description}>
    <StudioCourseEditor course={course} workbooks={workbooks} releases={releases} />
  </StudioShell>;
}
