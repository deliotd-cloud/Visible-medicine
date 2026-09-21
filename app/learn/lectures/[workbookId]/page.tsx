import type { Metadata } from "next";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { LectureLesson } from "@/components/LectureLesson";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Lecture",robots:{index:false,follow:false}};
export default async function LecturePage({params}:{params:Promise<{workbookId:string}>}) {
  const {workbookId}=await params;
  const user=await requireChatGPTUser(`/learn/lectures/${encodeURIComponent(workbookId)}`);
  return <LectureLesson auth={{userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName}} workbookId={workbookId} />;
}
