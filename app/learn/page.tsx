import type { Metadata } from "next";
import { EducationRuntime } from "../../components/EducationRuntime";
import { requireChatGPTUser } from "../chatgpt-auth";
import "./runtime.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning workspace",
  description: "Authenticated Visible Medicine teaching, examination and review workspace.",
  robots: { index: false, follow: false },
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default async function LearningWorkspacePage() {
  await requireChatGPTUser("/learn");
  return <EducationRuntime />;
}
