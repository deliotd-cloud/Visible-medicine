import type { Metadata } from "next";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { LectureLesson } from "@/components/LectureLesson";
import {lectureRequestReturnPath,parseLectureSlideRequest,type LectureSearchParams} from '@/lib/lecture-slide-navigation';
import {parseLectureTourContext} from '@/lib/lecture-tour-context';
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Lecture",robots:{index:false,follow:false}};
export default async function LecturePage({params,searchParams}:{params:Promise<{workbookId:string}>;searchParams?:Promise<LectureSearchParams>}) {
  const {workbookId}=await params;
  const query=(await searchParams)??{},slideRequest=parseLectureSlideRequest(query),tourContext=parseLectureTourContext(query);
  const user=await requireChatGPTUser(lectureRequestReturnPath(workbookId,undefined,slideRequest,tourContext));
  return <LectureLesson auth={{userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName}} workbookId={workbookId} slideRequest={slideRequest} tourContext={tourContext} />;
}
