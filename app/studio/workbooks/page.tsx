import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { StudioShell } from "@/components/StudioShell";
import { StudioWorkbookTable } from "@/components/StudioWorkbookTable";
import { getStudioSnapshot } from "@/lib/education-platform";
import { workbookQueue, type StudioQueueParams } from "@/lib/studio-queues";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio workbooks", robots: { index: false, follow: false } };

export default async function StudioWorkbooksPage({ searchParams }: { searchParams: Promise<StudioQueueParams> }) {
  const queue = workbookQueue(await searchParams);
  const user = await requireChatGPTUser(queue === "editing" ? "/studio/workbooks?queue=editing" : "/studio/workbooks");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Workbooks" title="Workbooks" description="Find teaching and assessment work, open the builder, or inspect its review status." actions={<Link href="/studio/presentation-preview">Preview a presentation</Link>}>
    <StudioWorkbookTable key={queue} workbooks={snapshot.workbooks} initialQueue={queue} />
  </StudioShell>;
}
