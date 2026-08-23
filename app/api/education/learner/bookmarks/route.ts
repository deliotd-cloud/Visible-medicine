import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { createLearnerBookmark, listLearnerBookmarks } from "@/lib/education-presentation-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { return Response.json(await listLearnerBookmarks(await authenticateEducationApi(), new URL(request.url).searchParams.get("caseId") ?? ""), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}

export async function POST(request: Request) {
  try { return Response.json(await createLearnerBookmark(await authenticateEducationApi(), await readEducationJson(request)), { status: 201, headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}
