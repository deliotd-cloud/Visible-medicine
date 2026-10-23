import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";
import { partitionStudioReviewQueue } from "@/lib/studio-review-queue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workspace", description: "Create, govern and deliver imaging education.", robots: { index: false, follow: false } };

export default async function StudioWorkspacePage() {
  const user = await requireChatGPTUser("/studio/workspace");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const draftWorkbooks = snapshot.workbooks.filter((workbook) => ["draft", "changes-requested"].includes(workbook.status));
  const review = partitionStudioReviewQueue(snapshot.releases,{actorId:`edu:${user.userId}`,organizationId:snapshot.organization.id,educationRoles:snapshot.educationRoles});
  const reviewQueue = review.independent.length
    ? { label: "Reviewable by you", count: review.independent.length, href: "/studio/publishing?review=independent", detail: "Review another author's current release" }
    : { label: "Awaiting independent review", count: review.awaiting.length, href: "/studio/publishing?review=awaiting", detail: "Track review progress; no decision is available here" };
  const releaseBlockers = snapshot.releases.filter((release) => release.status === "changes-requested").length;
  const queues = [
    { label: "Drafts to continue", count: draftWorkbooks.length, href: "/studio/workbooks?queue=editing", detail: "Open content and case authoring" },
    reviewQueue,
    { label: "Changes requested", count: releaseBlockers, href: "/studio/publishing?status=changes-requested", detail: "Resolve release feedback" },
  ].filter((queue) => queue.count > 0);
  return <StudioShell snapshot={snapshot} eyebrow="Home" title="Workspace" description="Continue editing, open a course or resolve the next review item." actions={<Link className="primary-button" href="/studio/courses?new=1">New course <span>→</span></Link>}>
    <section className="studio-home-grid">
      <div className="studio-home-panel"><header><div><p className="section-index">Continue editing</p><h2>Current drafts</h2></div><Link href="/studio/workbooks">Open workbooks →</Link></header>{draftWorkbooks.slice(0, 4).map((workbook) => <Link className="studio-list-row" href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`} key={workbook.id}><span>{workbook.mode}</span><div><b>{workbook.title}</b><small>{workbook.courseTitle} · v{workbook.version} · {workbook.status.replaceAll("-", " ")}</small></div><i>Edit →</i></Link>)}{!draftWorkbooks.length && <p className="studio-quiet-state">No workbook drafts need editing.</p>}</div>
      <div className="studio-home-panel"><header><div><p className="section-index">Courses</p><h2>Your courses</h2></div><Link href="/studio/courses">View all →</Link></header>{snapshot.courses.slice(0, 4).map((course) => <Link className="studio-list-row" href={`/studio/courses/${encodeURIComponent(course.id)}`} key={course.id}><span>{course.code}</span><div><b>{course.title}</b><small>{course.workbookCount} workbooks · {course.releaseCount} releases</small></div><i>Open →</i></Link>)}{!snapshot.courses.length && <p className="studio-quiet-state">No courses yet. Start with the New course action.</p>}</div>
    </section>
    {queues.length > 0 && <section className="studio-action-queues" aria-labelledby="studio-action-queues-title"><header><p className="section-index">Review &amp; publish</p><h2 id="studio-action-queues-title">Next steps</h2></header><div>{queues.map((queue) => <Link href={queue.href} key={queue.label}><b>{queue.count}</b><span>{queue.label}</span><small>{queue.detail}</small></Link>)}</div>{review.independent.length>0&&review.awaiting.length>0&&<p className="studio-quiet-state"><Link href="/studio/publishing?review=awaiting">{review.awaiting.length} awaiting independent review →</Link></p>}</section>}
  </StudioShell>;
}
