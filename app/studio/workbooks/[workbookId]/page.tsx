import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbook", robots: { index: false, follow: false } };

export default async function StudioWorkbookPage({ params }: { params: Promise<{ workbookId: string }> }) {
  const workbookId = decodeURIComponent((await params).workbookId);
  const user = await requireChatGPTUser(`/studio/workbooks/${encodeURIComponent(workbookId)}`);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const workbook = snapshot.workbooks.find((item) => item.id === workbookId); if (!workbook) notFound();
  return <StudioShell snapshot={snapshot} eyebrow={`${workbook.mode} workbook`} title={workbook.title} description={`${workbook.courseTitle} · ${workbook.moduleTitle}`} actions={<Link className="primary-button" href={`/learn?view=authoring&workbook=${encodeURIComponent(workbook.id)}`}>Open focused builder <span>→</span></Link>}>
    <section className="workbook-management-grid"><div><p className="section-index">Workbook state</p><h2>Version {workbook.version}</h2><dl><div><dt>Status</dt><dd><span className={`status-badge ${workbook.status}`}>{workbook.status}</span></dd></div><div><dt>Mode</dt><dd>{workbook.mode}</dd></div><div><dt>Cases</dt><dd>{workbook.caseCount}</dd></div><div><dt>Assessment duration</dt><dd>{workbook.durationMinutes ? `${workbook.durationMinutes} minutes` : "Not timed"}</dd></div></dl></div><div className="viewer-boundary-card"><span>Focused authoring workspace</span><h2>Why the image editor is dark.</h2><p>The medical-image canvas remains neutral and low-distraction. Elivion navigation, identity, accessibility and return paths surround it, while clinical Didanix settings and identities remain completely separate.</p><Link href={`/learn?view=authoring&workbook=${encodeURIComponent(workbook.id)}`}>Edit cases and teaching content →</Link></div></section>
  </StudioShell>;
}
