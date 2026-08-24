import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio analytics", robots: { index: false, follow: false } };

export default async function StudioAnalyticsPage() {
  const user = await requireChatGPTUser("/studio/analytics");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const maxLearners = Math.max(1, ...snapshot.courses.map((course) => course.enrolledLearners));
  return <StudioShell snapshot={snapshot} eyebrow="Learning insight" title="See participation without crossing the education boundary." description="Aggregate course and workbook activity helps educators improve teaching. Learner answers and clinical systems remain outside this organisation summary.">
    <section className="studio-metrics analytics"><article><span>Enrolled learners</span><b>{snapshot.metrics.learners}</b><small>Active education enrolments</small></article><article><span>Average progress</span><b>{snapshot.metrics.completionPercent}%</b><small>Across recorded workbooks</small></article><article><span>Published releases</span><b>{snapshot.metrics.publishedReleases}</b><small>Approved learner-facing versions</small></article><article><span>Active cohorts</span><b>{snapshot.cohorts.filter((cohort) => cohort.status === "active").length}</b><small>Bounded teaching groups</small></article></section>
    <section className="analytics-course-list"><header><div><p className="section-index">Course reach</p><h2>Enrolment by course</h2></div><Link href="/studio/courses">Manage courses →</Link></header>{snapshot.courses.map((course) => <article key={course.id}><div><span>{course.code}</span><b>{course.title}</b></div><div className="analytics-bar"><i><b style={{ width: `${Math.round(course.enrolledLearners / maxLearners * 100)}%` }} /></i><span>{course.enrolledLearners} learners</span></div><small>{course.workbookCount} workbooks · {course.releaseCount} releases</small></article>)}</section>
    <section className="analytics-boundary"><div><p className="section-index">Reporting boundary</p><h2>Learning evidence, not clinical surveillance.</h2></div><p>Studio reports education participation, completion and assessment events only. It does not ingest PACS activity, clinical reports, patient records or diagnostic performance data.</p></section>
  </StudioShell>;
}
