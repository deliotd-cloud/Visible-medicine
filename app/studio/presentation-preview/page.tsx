import type { Metadata } from "next";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { getStudioSnapshot } from "@/lib/education-platform";
import { StudioShell } from "@/components/StudioShell";
import { StudioSlidePreview } from "@/components/StudioSlidePreview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private presentation preview", robots: { index: false, follow: false } };

export default async function PresentationPreviewPage() {
  const user = await requireChatGPTUser("/studio/presentation-preview");
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <StudioShell snapshot={snapshot} eyebrow="Presentation preview" title="Presentation preview" description="Inspect the original slide visuals and notes before preparing course content. This local review does not import or publish a lecture.">
    <StudioSlidePreview />
  </StudioShell>;
}
