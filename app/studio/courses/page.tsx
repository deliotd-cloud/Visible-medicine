import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { CreateCourseForm } from "@/components/StudioForms";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio courses", robots: { index: false, follow: false } };

export default async function StudioCoursesPage() {
  const user = await requireChatGPTUser("/studio/courses");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Course architecture" title="Courses organise the teaching story." description="Create the course container first, then add teaching or assessment workbooks and prepare an explicit learner-facing release.">
    <section className="studio-two-panel"><div><p className="section-index">Your courses</p><div className="studio-card-grid">{snapshot.courses.map((course) => <Link className="studio-course-card" href={`/studio/courses/${encodeURIComponent(course.id)}`} key={course.id}><span>{course.code} · {course.status}</span><h2>{course.title}</h2><p>{course.description}</p><footer><b>{course.workbookCount} workbooks</b><b>{course.releaseCount} releases</b><b>{course.enrolledLearners} learners</b></footer></Link>)}</div></div><aside><p className="section-index">New course</p><h2>Start with intent.</h2><p>A course is private until an approved release explicitly gives it an audience and access model.</p><CreateCourseForm /></aside></section>
  </StudioShell>;
}
