import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbooks", robots: { index: false, follow: false } };

export default async function StudioWorkbooksPage() {
  const user = await requireChatGPTUser("/studio/workbooks");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Imaging-native content" title="Workbooks hold the cases." description="Manage each workbook in Studio, then enter the focused image workspace only when you need case, viewer-scene, question or live-teaching tools.">
    <section className="studio-table"><header><span>Workbook</span><span>Course</span><span>Mode</span><span>State</span><span>Cases</span><span /></header>{snapshot.workbooks.map((workbook) => <Link href={`/studio/workbooks/${encodeURIComponent(workbook.id)}`} key={workbook.id}><b>{workbook.title}</b><span>{workbook.courseTitle}</span><span>{workbook.mode}</span><span className={`status-badge ${workbook.status}`}>{workbook.status}</span><span>{workbook.caseCount}</span><i>→</i></Link>)}</section>
  </StudioShell>;
}
