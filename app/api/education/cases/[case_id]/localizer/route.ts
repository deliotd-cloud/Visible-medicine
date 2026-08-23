import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { mapEducationLocalizer } from "@/lib/education-presentation-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ case_id: string }> }) {
  try { const { case_id: caseId } = await params; return Response.json(await mapEducationLocalizer(await authenticateEducationApi(), caseId, await readEducationJson(request, 24_000)), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return educationApiErrorResponse(error); }
}
