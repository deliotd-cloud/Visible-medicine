import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { updateInstructorPresentation } from "@/lib/education-presentation-repository";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ workbook_id: string; presentation_id: string }> }) {
  try { const value = await params; return Response.json(await updateInstructorPresentation(await authenticateEducationApi(), "workbook", value.workbook_id, value.presentation_id, await readEducationJson(request)), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ workbook_id: string; presentation_id: string }> }) {
  try { const value = await params; return Response.json(await updateInstructorPresentation(await authenticateEducationApi(), "workbook", value.workbook_id, value.presentation_id, await readEducationJson(request), true), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}
