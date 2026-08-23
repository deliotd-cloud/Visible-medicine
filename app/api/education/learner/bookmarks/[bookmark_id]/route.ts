import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { updateLearnerBookmark } from "@/lib/education-presentation-repository";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ bookmark_id: string }> }) {
  try { const { bookmark_id: bookmarkId } = await params; return Response.json(await updateLearnerBookmark(await authenticateEducationApi(), bookmarkId, await readEducationJson(request)), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ bookmark_id: string }> }) {
  try { const { bookmark_id: bookmarkId } = await params; return Response.json(await updateLearnerBookmark(await authenticateEducationApi(), bookmarkId, await readEducationJson(request), true), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}
