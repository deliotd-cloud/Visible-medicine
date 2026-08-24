import type { Metadata } from "next";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { AssignCohortWorkbookForm, CreateCohortForm } from "@/components/StudioForms";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio cohorts", robots: { index: false, follow: false } };

export default async function StudioCohortsPage() {
  const user = await requireChatGPTUser("/studio/cohorts");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Learner delivery" title="Cohorts keep access bounded." description="Group enrolled learners by course, then allocate only the published workbooks intended for that teaching group.">
    <section className="studio-two-panel"><div><p className="section-index">Active cohorts</p><div className="cohort-grid">{snapshot.cohorts.map((cohort) => <article key={cohort.id}><header><span>{cohort.code}</span><span className={`status-badge ${cohort.status}`}>{cohort.status}</span></header><h2>{cohort.title}</h2><p>{cohort.courseTitle}</p><dl><div><dt>Learners</dt><dd>{cohort.memberCount}</dd></div><div><dt>Assigned workbooks</dt><dd>{cohort.workbookCount}</dd></div></dl><AssignCohortWorkbookForm cohortId={cohort.id} workbooks={snapshot.workbooks.filter((workbook) => workbook.courseId === cohort.courseId)} /></article>)}{!snapshot.cohorts.length && <div className="catalogue-empty"><h2>No cohorts yet.</h2><p>Create the first bounded teaching group for one of your courses.</p></div>}</div></div><aside><p className="section-index">New cohort</p><h2>Create a teaching group.</h2><p>Learners join a course through enrolment or invitation before an educator places them into a cohort.</p><CreateCohortForm courses={snapshot.courses} /></aside></section>
  </StudioShell>;
}
