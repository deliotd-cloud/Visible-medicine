import { authenticateEducationApi, educationApiErrorResponse, readEducationJson } from "@/lib/education-api";
import { createInstructorPresentation, listInstructorPresentations } from "@/lib/education-presentation-repository";
import { normalizeEducationCaseId } from "@/lib/education-identifiers";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ case_id: string }> }) {
  try {
    const { case_id: rawCaseId } = await params; const query = new URL(request.url).searchParams;
    const caseId = normalizeEducationCaseId(rawCaseId);
    const auth = await authenticateEducationApi();
    const context = query.get("context") === "exam" ? "exam" : "teaching";
    const requestedWorkbookId = query.get("workbookId") ?? query.get("workbook_id") ?? "";
    const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
    if (!requestedWorkbookId) {
      return Response.json(
        { error: "workbookId is required when loading case presentations." },
        { status: 422 },
      );
    }
    const compatibility = [];
    if (query.has("workbook_id")) compatibility.push("workbook_id");
    if (rawCaseId !== caseId) compatibility.push("case_id");
    if (compatibility.length)
      headers["X-Didanix-Query-Compatibility"] = `legacy=${compatibility.join(",")}`;
    return Response.json(await listInstructorPresentations(auth, "case", caseId, context, query.get("includeHistory") === "true", requestedWorkbookId), { headers });
  } catch (error) { return educationApiErrorResponse(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ case_id: string }> }) {
  try {
    const { case_id: rawCaseId } = await params;
    const caseId = normalizeEducationCaseId(rawCaseId);
    return Response.json(await createInstructorPresentation(await authenticateEducationApi(), "case", caseId, await readEducationJson(request)), { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return educationApiErrorResponse(error); }
}
