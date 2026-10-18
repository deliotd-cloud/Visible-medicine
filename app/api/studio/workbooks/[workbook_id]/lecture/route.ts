import { authenticateEducationApi } from "@/lib/education-api";
import { getLectureStudio, mutateLecture } from "@/lib/lecture-repository";
import { lectureApiFailure, readLectureRequest } from "@/lib/lecture-api";
import { enforceRateLimit } from "@/lib/institution-operations";

export const dynamic="force-dynamic";
type Context={params:Promise<{workbook_id:string}>};
export async function GET(_request:Request,{params}:Context) {
  try { return Response.json(await getLectureStudio(await authenticateEducationApi(),(await params).workbook_id),{headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return lectureApiFailure(error); }
}
export async function POST(request:Request,{params}:Context) {
  try {
    const auth=await authenticateEducationApi();
    await enforceRateLimit(auth.userId,"studio-write",45,60);
    const input=await readLectureRequest(request);
    return Response.json(await mutateLecture(auth,(await params).workbook_id,input),{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) { return lectureApiFailure(error); }
}
