import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { InvitationForm, ReleaseWorkflowActions } from "@/components/StudioForms";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";
import { releaseReadiness } from "@/lib/pilot-readiness";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio publishing", robots: { index: false, follow: false } };

const stages = ["Draft", "Workbook publication", "Independent review", "Course release"];

export default async function StudioPublishingPage() {
  const user = await requireChatGPTUser("/studio/publishing");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const canPublish = snapshot.educationRoles.includes("administrator");
  return <StudioShell snapshot={snapshot} eyebrow="Governed release" title="Nothing reaches learners by accident." description="Workbook publication freezes educational content. Course release separately controls its catalogue identity, selected workbooks, audience, access and enrolment.">
    <section className="studio-publishing-steps">{stages.map((stage, index) => <div key={stage}><span>{String(index + 1).padStart(2, "0")}</span><b>{stage}</b></div>)}</section>
    <section className="studio-release-ledger">{snapshot.releases.map((release) => { const readiness = releaseReadiness(release); const history = snapshot.releaseHistory.filter((item) => item.releaseId === release.id); return <article key={release.id}><header><div><span>{release.publisherKind} · v{release.version}</span><h2>{release.title}</h2><p>{release.summary}</p></div><span className={`status-badge ${release.status}`}>{release.status}</span></header><div className="release-ledger-facts"><span><b>Visibility</b>{release.visibility}</span><span><b>Access</b>{release.accessModel}</span><span><b>Workbooks</b>{release.workbookCount}</span><span><b>Enrolment</b>{release.enrolmentOpen ? "Open" : "Closed"}</span></div><div className="release-checklist"><header><b>Publication checklist</b><span>{readiness.complete} / {readiness.checks.length}</span></header>{readiness.checks.map((check) => <span className={check.ready ? "complete" : "pending"} key={check.key}>{check.ready ? "✓" : "○"} {check.label}</span>)}</div><ReleaseWorkflowActions release={release} canPublish={canPublish} />{release.status === "published" && release.accessModel === "invitation" && <details className="release-invitation-panel"><summary>Create an invitation</summary><InvitationForm releaseId={release.id} /></details>}{history.length > 0 && <details className="release-history"><summary>Version history · {history.length} snapshots</summary>{history.map((item) => <div key={item.id}><span>v{item.version} · {item.status}</span><b>{item.reason.replaceAll("-", " ")}</b><small>{new Date(item.capturedAt).toLocaleString("en-GB")}</small></div>)}</details>}<footer><Link href={`/studio/courses/${encodeURIComponent(release.courseId)}`}>Open course →</Link><Link href={`/studio/releases/${encodeURIComponent(release.id)}/preview`}>Preview as learner →</Link>{release.status === "published" && release.visibility !== "private" && <Link href={`/courses/${release.slug}`}>View learner page →</Link>}</footer></article>; })}</section>
  </StudioShell>;
}
