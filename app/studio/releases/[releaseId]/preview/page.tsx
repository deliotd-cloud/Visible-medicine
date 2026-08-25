import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireChatGPTUser } from "../../../../chatgpt-auth";
import { getStudioSnapshot } from "@/lib/education-platform";
import { releaseReadiness } from "@/lib/pilot-readiness";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course learner preview", robots: { index: false, follow: false } };

export default async function ReleasePreviewPage({ params }: { params: Promise<{ releaseId: string }> }) {
  const releaseId = decodeURIComponent((await params).releaseId);
  const user = await requireChatGPTUser(`/studio/releases/${encodeURIComponent(releaseId)}/preview`);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const release = snapshot.releases.find((item) => item.id === releaseId); if (!release) notFound();
  const readiness = releaseReadiness(release);
  return <main className="inner-page release-preview-page">
    <section className="preview-mode-banner"><div><span>Studio preview</span><b>Learner-facing course page</b></div><p>This is not a published catalogue route. Enrolment and payment actions are disabled.</p><Link href="/studio/publishing">Return to publishing →</Link></section>
    <section className="course-detail-hero preview-course-hero"><div><p className="eyebrow"><span /> {release.publisherKind === "official" ? "Elivion official course" : "Institution-published course"}</p><h1>{release.title}</h1><p>{release.summary}</p><div className="module-facts"><span>{release.level}</span><span>{release.workbookCount} workbooks</span><span>{release.duration}</span><span>{release.publisher}</span></div></div><div className="course-launch-card"><span>Previewed access</span><b>{release.accessModel} · {release.visibility}</b><p>A learner will see enrolment controls here only after the independently reviewed release is published and its access route is active.</p><button className="primary-button" disabled>Preview only</button></div></section>
    <section className="course-detail-grid"><div><p className="section-index">Learning outcomes</p><h2>What learners will be able to do</h2><ol>{release.outcomes.map((outcome, index) => <li key={outcome}><span>{String(index + 1).padStart(2, "0")}</span>{outcome}</li>)}</ol></div><div className="release-readiness-panel"><p className="section-index">Release readiness</p><h2>{readiness.complete} / {readiness.checks.length} checks complete</h2>{readiness.checks.map((check) => <div className={check.ready ? "complete" : "pending"} key={check.key}><span>{check.ready ? "✓" : "○"}</span><b>{check.label}</b></div>)}</div></section>
  </main>;
}
