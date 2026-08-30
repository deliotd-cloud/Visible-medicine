import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { DuplicateWorkbookButton } from "@/components/StudioForms";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbook", robots: { index: false, follow: false } };

export default async function StudioWorkbookPage({ params }: { params: Promise<{ workbookId: string }> }) {
  const workbookId = decodeURIComponent((await params).workbookId);
  const user = await requireChatGPTUser(`/studio/workbooks/${encodeURIComponent(workbookId)}`);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const workbook = snapshot.workbooks.find((item) => item.id === workbookId); if (!workbook) notFound();
  const canTeachLive = workbook.mode === "teaching" && workbook.status === "published";
  return <StudioShell snapshot={snapshot} eyebrow={`${workbook.mode} workbook`} title={workbook.title} description={`${workbook.courseTitle} · ${workbook.moduleTitle}`} actions={<div className="studio-heading-actions">{canTeachLive && <Link className="primary-button" href={`/learn?view=teaching&workbook=${encodeURIComponent(workbook.id)}`}>Open live teaching <span>→</span></Link>}<Link className={canTeachLive ? "outline-button" : "primary-button"} href={`/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}>Open focused builder <span>→</span></Link><DuplicateWorkbookButton workbookId={workbook.id} /></div>}>
    <section className="workbook-management-grid"><div><p className="section-index">Workbook state</p><h2>Version {workbook.version}</h2><dl><div><dt>Status</dt><dd><span className={`status-badge ${workbook.status}`}>{workbook.status}</span></dd></div><div><dt>Mode</dt><dd>{workbook.mode}</dd></div><div><dt>Cases</dt><dd>{workbook.caseCount}</dd></div><div><dt>Assessment duration</dt><dd>{workbook.durationMinutes ? `${workbook.durationMinutes} minutes` : "Not timed"}</dd></div></dl></div><div className="viewer-boundary-card"><span>{canTeachLive ? "Teaching delivery workspace" : "Focused authoring workspace"}</span><h2>{canTeachLive ? "Teach and present without leaving the case." : "Why the image editor is dark."}</h2><p>{canTeachLive ? "Open the teaching viewer, start Follow Me, then add the recording-free video classroom. Learners see the live session from their course and My Learning pages." : "The medical-image canvas remains neutral and low-distraction. Visible Medicine navigation, identity, accessibility and return paths surround it, while clinical Didanix settings and identities remain completely separate."}</p><Link href={canTeachLive ? `/learn?view=teaching&workbook=${encodeURIComponent(workbook.id)}` : `/studio/workbooks/${encodeURIComponent(workbook.id)}/builder`}>{canTeachLive ? "Prepare live teaching" : "Edit cases and teaching content"} →</Link></div></section>
  </StudioShell>;
}
