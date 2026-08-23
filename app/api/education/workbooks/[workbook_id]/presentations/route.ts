import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { createInstructorPresentation, listInstructorPresentations } from "@/lib/education-presentation-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ workbook_id: string }> }) {
  try {
    const { workbook_id: workbookId } = await params; const query = new URL(request.url).searchParams;
    const context = query.get("context") === "exam" ? "exam" : "teaching";
    return Response.json(await listInstructorPresentations(await authenticateEducationApi(), "workbook", workbookId, context, query.get("includeHistory") === "true"), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return educationApiErrorResponse(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ workbook_id: string }> }) {
  try { const { workbook_id: workbookId } = await params; return Response.json(await createInstructorPresentation(await authenticateEducationApi(), "workbook", workbookId, await readEducationJson(request)), { status: 201, headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}
