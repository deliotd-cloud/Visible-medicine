import {
  authenticateEducationApi,
  EducationApiError,
  educationApiErrorResponse,
  readEducationJson,
} from "@/lib/education-api";
import { answerTeachingPoll, controlTeachingPoll, getTeachingPollBundle, startTeachingPoll } from "@/lib/teaching-poll-repository";
import { normalizeEducationCaseId } from "@/lib/education-identifiers";
import { notifyTeachingLiveWorkbook } from "@/lib/teaching-live-transport";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const auth = await authenticateEducationApi();
    const rawCaseId = query.get("caseId") ?? query.get("case_id") ?? "";
    const caseId = normalizeEducationCaseId(rawCaseId);
    const workbookId = query.get("workbookId") ?? query.get("workbook_id") ?? undefined;
    if (!caseId)
      throw new EducationApiError(
        "caseId is required to load teaching polls.",
        422,
      );
    const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
    const legacy = [];
    if (query.has("case_id")) legacy.push("case_id");
    if (rawCaseId !== caseId && !legacy.includes("case_id")) legacy.push("case_id");
    if (query.has("workbook_id")) legacy.push("workbook_id");
    if (legacy.length)
      headers["X-Didanix-Query-Compatibility"] = `legacy=${legacy.join(",")}`;
    return Response.json(await getTeachingPollBundle(auth, caseId, workbookId), { headers });
  } catch (error) { return educationApiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const payload = await readEducationJson(request, 32_000); const auth = await authenticateEducationApi(); const action = payload.action;
    const result = action === "start" ? await startTeachingPoll(auth, payload) : action === "control" ? await controlTeachingPoll(auth, payload) : action === "answer" ? await answerTeachingPoll(auth, payload) : null;
    if (!result) return Response.json({ error: "Unknown teaching poll action." }, { status: 404 });
    const workbookId = result.polls[0]?.workbookId ?? "";
    if (workbookId) await notifyTeachingLiveWorkbook(workbookId);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return educationApiErrorResponse(error); }
}
