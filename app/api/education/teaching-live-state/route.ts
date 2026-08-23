import {
  authenticateEducationApi,
  EducationApiError,
  educationApiErrorResponse,
} from "@/lib/education-api";
import { normalizeEducationCaseId } from "@/lib/education-identifiers";
import { getTeachingPollBundle } from "@/lib/teaching-poll-repository";
import { getTeachingSessionBundle } from "@/lib/teaching-session-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const workbookId = query.get("workbookId") ?? "";
    const caseId = normalizeEducationCaseId(query.get("caseId") ?? "");
    if (!workbookId || !caseId)
      throw new EducationApiError(
        "workbookId and caseId are required to load live teaching state.",
        422,
      );
    const auth = await authenticateEducationApi();
    const [polls, session] = await Promise.all([
      getTeachingPollBundle(auth, caseId, workbookId),
      getTeachingSessionBundle(auth, workbookId),
    ]);
    return Response.json(
      { polls, session, refreshedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
