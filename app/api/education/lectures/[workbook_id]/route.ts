import { authenticateEducationApi } from "@/lib/education-api";
import { getPublishedLecture } from "@/lib/lecture-repository";
import { lectureApiFailure } from "@/lib/lecture-api";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{workbook_id:string}>}) {
  try { return Response.json(await getPublishedLecture(await authenticateEducationApi(),(await params).workbook_id),{headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return lectureApiFailure(error); }
}
