import type { Metadata } from "next";
import { EducationRuntime } from "@/components/EducationRuntime";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import "../../runtime.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course workspace", description: "Elivion Education course-specific imaging workspace.", robots: { index: false, follow: false } };

export default async function CourseLearningPage({ params }: { params: Promise<{ courseSlug: string; workbookId: string }> }) {
  const { courseSlug, workbookId } = await params;
  const safeCourse = courseSlug.replace(/[^a-z0-9-]/g, "");
  const safeWorkbook = decodeURIComponent(workbookId).replace(/[^a-zA-Z0-9:_-]/g, "");
  await requireChatGPTUser(`/learn/${safeCourse}/${encodeURIComponent(safeWorkbook)}`);
  return <EducationRuntime workbookId={safeWorkbook} />;
}
