import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { ReleaseWorkflowActions } from "@/components/StudioForms";
import { CourseInvitationPanel } from "@/components/CourseInvitationPanel";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";
import { releaseReadiness } from "@/lib/pilot-readiness";
import { filterReleaseQueue, parseReleaseQueue, RELEASE_QUEUE_STATUSES, type StudioQueueParams } from "@/lib/studio-queues";
import { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue } from "@/lib/studio-review-queue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio publishing", robots: { index: false, follow: false } };

const stages = ["Draft", "Workbook publication", "Independent review", "Course release"];

export default async function StudioPublishingPage({ searchParams }: { searchParams: Promise<StudioQueueParams> }) {
  const queue = parseReleaseQueue(await searchParams);
  const returnQuery = new URLSearchParams();
  if (queue.valid && queue.status !== "all") returnQuery.set("status", queue.status);
  if (queue.valid && queue.course) returnQuery.set("course", queue.course);
  if (queue.valid && queue.review) returnQuery.set("review", queue.review);
  const user = await requireChatGPTUser(`/studio/publishing${returnQuery.size ? `?${returnQuery}` : ""}`);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const recoveryScope = { actorId: `edu:${user.userId}`, organizationId: snapshot.organization.id };
  const canPublish = snapshot.educationRoles.includes("administrator");
  const reviewContext={...recoveryScope,educationRoles:snapshot.educationRoles};
  const filtered = filterReleaseQueue(snapshot.releases, queue);
  const releases = queue.review ? partitionStudioReviewQueue(filtered,reviewContext)[queue.review] : filtered;
  const unavailableCourse = queue.valid && queue.course && !snapshot.courses.some((course) => course.id === queue.course);
  return <StudioShell snapshot={snapshot} eyebrow="Governed release" title="Nothing reaches learners by accident." description="Workbook publication freezes educational content. Course release separately controls its catalogue identity, selected workbooks, audience, access and enrolment.">
    <section className="studio-publishing-steps">{stages.map((stage, index) => <div key={stage}><span>{String(index + 1).padStart(2, "0")}</span><b>{stage}</b></div>)}</section>
    <section className="studio-queue-filters" aria-label="Filter release queue">
      <form action="/studio/publishing" method="get" key={`${queue.valid}:${queue.status}:${queue.course}`}>
        {queue.valid&&queue.review&&<input type="hidden" name="review" value={queue.review}/>}
        <label><span>Status</span><select name="status" defaultValue={queue.valid ? queue.status : "all"}><option value="all">All statuses</option>{RELEASE_QUEUE_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("-", " ")}</option>)}</select></label>
        <label><span>Course</span><select name="course" defaultValue={queue.valid ? queue.course : ""}><option value="">All courses</option>{unavailableCourse && <option value={queue.course}>Unavailable course</option>}{snapshot.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <button type="submit">Apply filters</button><Link href="/studio/publishing">Clear filters</Link>
      </form>
      <p>{releases.length} of {snapshot.releases.length} releases{queue.valid ? "" : " · Invalid filter. Choose a status and course, then apply."}</p>
      {queue.valid&&queue.review&&<p role="status">{queue.review==="independent"?"Reviewable by you · current releases by another author":"Awaiting independent review · no decision offered to this user for these revisions"}. Status and course filters also apply. <Link href="/studio/publishing">View all releases →</Link></p>}
      {!releases.length && <p className="studio-quiet-state">{snapshot.releases.length ? "No releases match these filters. Clear filters to view all available releases." : "No course releases yet. Open a course to prepare its first release."}</p>}
    </section>
    <section className="studio-release-ledger">{releases.map((release) => { const readiness = releaseReadiness(release); const history = snapshot.releaseHistory.filter((item) => item.releaseId === release.id); return <article key={release.id}><header><div><span>{release.publisherKind} · v{release.version}</span><h2>{release.title}</h2><p>{release.summary}</p></div><span className={`status-badge ${release.status}`}>{release.status}</span></header><div className="release-ledger-facts"><span><b>Visibility</b>{release.visibility}</span><span><b>Access</b>{release.accessModel}</span><span><b>Workbooks</b>{release.workbookCount}</span><span><b>Enrolment</b>{release.enrolmentOpen ? "Open" : "Closed"}</span></div><div className="release-checklist"><header><b>Publication checklist</b><span>{readiness.complete} / {readiness.checks.length}</span></header>{readiness.checks.map((check) => <span className={check.ready ? "complete" : "pending"} key={check.key}>{check.ready ? "✓" : "○"} {check.label}</span>)}</div>{!isPendingIndependentReview(release)||canOfferIndependentReview(release,reviewContext)?<ReleaseWorkflowActions release={release} canPublish={canPublish} recoveryScope={recoveryScope} />:<p className="studio-quiet-state">{release.createdBy===recoveryScope.actorId?"Another education user must review your release.":"Independent review is unavailable for this user or revision. Review the current release details before continuing."}</p>}{release.accessModel === "invitation" && <CourseInvitationPanel releaseId={release.id} recoveryScope={recoveryScope} canCreate={release.status === "published"} />}{history.length > 0 && <details className="release-history"><summary>Version history · {history.length} snapshots</summary>{history.map((item) => <div key={item.id}><span>v{item.version} · {item.status}</span><b>{item.reason.replaceAll("-", " ")}</b><small>{new Date(item.capturedAt).toLocaleString("en-GB")}</small></div>)}</details>}<footer><Link href={`/studio/courses/${encodeURIComponent(release.courseId)}`}>Open course →</Link><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>Preview as learner →</Link>{release.status === "published" && release.visibility !== "private" && <Link href={`/courses/${release.slug}`}>View learner page →</Link>}</footer></article>; })}</section>
  </StudioShell>;
}
