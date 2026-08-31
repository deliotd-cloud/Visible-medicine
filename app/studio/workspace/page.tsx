import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workspace", description: "Create, govern and deliver imaging education.", robots: { index: false, follow: false } };

export default async function StudioWorkspacePage() {
  const user = await requireChatGPTUser("/studio/workspace");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const draftWorkbooks = snapshot.workbooks.filter((workbook) => ["draft", "changes-requested"].includes(workbook.status)).length;
  const awaitingReview = snapshot.releases.filter((release) => release.status === "in-review").length;
  const releaseBlockers = snapshot.releases.filter((release) => release.status === "changes-requested").length;
  return <StudioShell snapshot={snapshot} eyebrow="Overview" title="Build and deliver imaging education." description="Continue drafts, resolve review work and manage your courses from one coordinated Studio workspace." actions={<Link className="primary-button" href="/studio/courses">Create a course <span>→</span></Link>}>
    <section className="studio-metrics"><article><span>Active courses</span><b>{snapshot.metrics.activeCourses}</b><small>{snapshot.courses.reduce((sum, course) => sum + course.workbookCount, 0)} workbooks</small></article><article><span>Published releases</span><b>{snapshot.metrics.publishedReleases}</b><small>{snapshot.releases.filter((release) => release.status !== "published").length} in workflow</small></article><article><span>Learners</span><b>{snapshot.metrics.learners}</b><small>Across this organisation</small></article><article><span>Average progress</span><b>{snapshot.metrics.completionPercent}%</b><small>Assigned workbook progress</small></article></section>
    <section className="studio-attention-grid" aria-label="Items requiring attention"><header><p className="section-index">Your work</p><h2>What needs attention</h2></header><Link href="/studio/workbooks"><span>Draft workbooks</span><b>{draftWorkbooks}</b><small>Continue content and case authoring</small></Link><Link href="/studio/publishing"><span>Awaiting review</span><b>{awaitingReview}</b><small>Independent decisions in progress</small></Link><Link href="/studio/publishing"><span>Changes requested</span><b>{releaseBlockers}</b><small>Resolve before publication</small></Link></section>
    <section className="studio-dashboard-grid"><div><header><p className="section-index">Courses</p><h2>Course structure</h2><Link href="/studio/courses">Manage all →</Link></header>{snapshot.courses.map((course) => <Link className="studio-list-row" href={`/studio/courses/${encodeURIComponent(course.id)}`} key={course.id}><span>{course.code}</span><div><b>{course.title}</b><small>{course.workbookCount} workbooks · {course.releaseCount} releases · {course.enrolledLearners} learners</small></div><i>→</i></Link>)}</div><div><header><p className="section-index">Release pipeline</p><h2>Publishing state</h2><Link href="/studio/publishing">Open pipeline →</Link></header>{snapshot.releases.map((release) => <article className="studio-list-row" key={release.id}><span className={`status-badge ${release.status}`}>{release.status}</span><div><b>{release.title}</b><small>{release.visibility} · {release.accessModel} · v{release.version}</small></div></article>)}</div></section>
    <section className="studio-focus-cta"><div><p className="section-index">Continue authoring</p><h2>Open a workbook when you need the image workspace.</h2><p>Viewer scenes, cases, questions, presentations and live teaching tools remain together in focused authoring.</p></div><Link href="/studio/workbooks">Choose a workbook →</Link></section>
  </StudioShell>;
}
