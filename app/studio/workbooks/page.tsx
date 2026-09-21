import type { Metadata } from "next";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { StudioWorkbookTable } from "@/components/StudioWorkbookTable";
import { getStudioSnapshot } from "@/lib/education-platform";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbooks", robots: { index: false, follow: false } };

export default async function StudioWorkbooksPage() {
  const user = await requireChatGPTUser("/studio/workbooks");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Library" title="Workbook library" description="Find existing teaching and assessment work, open it directly in the builder, or inspect its governed state.">
    <StudioWorkbookTable workbooks={snapshot.workbooks} />
  </StudioShell>;
}
