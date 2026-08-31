import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { StudioWorkbookTable } from "@/components/StudioWorkbookTable";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbooks", robots: { index: false, follow: false } };

export default async function StudioWorkbooksPage() {
  const user = await requireChatGPTUser("/studio/workbooks");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Workbooks" title="Workbooks hold the cases." description="Search, review and continue each workbook here, then enter the focused image workspace only for case and teaching content." actions={<Link className="primary-button" href="/studio/courses">New workbook <span>→</span></Link>}>
    <StudioWorkbookTable workbooks={snapshot.workbooks} />
  </StudioShell>;
}
