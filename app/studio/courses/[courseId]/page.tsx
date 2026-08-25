import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { CreateWorkbookForm, DuplicateCourseButton, ReleaseDraftForm } from "@/components/StudioForms";
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
  return <StudioShell snapshot={snapshot} eyebrow={`${course.code} · Course`} title={course.title} description={course.description} actions={<div className="studio-heading-actions"><Link className="outline-button" href="/studio/publishing">Open publishing pipeline <span>→</span></Link><DuplicateCourseButton courseId={course.id} /></div>}>
    <section className="studio-course-summary"><div><span>{workbooks.length}</span><p>Workbooks</p></div><div><span>{releases.length}</span><p>Releases</p></div><div><span>{course.enrolledLearners}</span><p>Enrolled learners</p></div></section>
    <section className="studio-two-panel"><div><p className="section-index">Course workbooks</p><div className="studio-card-grid compact">{workbooks.map((workbook) => <Link className="studio-workbook-card" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`} key={workbook.id}><span>{workbook.mode} · {workbook.status}</span><h2>{workbook.title}</h2><p>{workbook.caseCount} cases · version {workbook.version}</p><b>Manage workbook →</b></Link>)}</div><div className="studio-inline-form"><h2>Add a workbook</h2><CreateWorkbookForm course={course} /></div></div><aside><p className="section-index">Learner-facing release</p><h2>{releases.length ? "Edit the current draft." : "Prepare a course release."}</h2><p>This record controls the catalogue description, selected workbooks, visibility, access and enrolment—not the workbook publication itself.</p><ReleaseDraftForm course={course} workbooks={workbooks} release={releases.find((release) => new Set(["draft", "changes-requested"]).has(release.status))} /></aside></section>
  </StudioShell>;
}
