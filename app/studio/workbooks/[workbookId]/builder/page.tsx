import type { Metadata } from "next";
import { EducationRuntime } from "@/components/EducationRuntime";
import { requireChatGPTUser } from "../../../../chatgpt-auth";
import "../../../../learn/runtime.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio workbook builder",
  description: "Institution-scoped Visible Medicine workbook authoring.",
  robots: { index: false, follow: false },
};

export default async function StudioWorkbookBuilderPage({
  params,
}: {
  params: Promise<{ workbookId: string }>;
}) {
  const rawWorkbookId = (await params).workbookId;
  const workbookId = decodeURIComponent(rawWorkbookId).replace(
    /[^a-zA-Z0-9:_-]/g,
    "",
  );
  const returnPath = `/studio/workbooks/${encodeURIComponent(workbookId)}/builder`;
  await requireChatGPTUser(returnPath);
  return (
    <EducationRuntime
      workbookId={workbookId}
      initialView="authoring"
      accessMode="authoring"
      returnTo={`/studio/workbooks/${encodeURIComponent(workbookId)}`}
    />
  );
}
