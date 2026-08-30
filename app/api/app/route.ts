import { getAuthContext } from "@/lib/auth";
import { addAnnotation, addCohortMember, addKeyImage, approveAccommodation, assignCohortWorkbook, assignWorkbook, createCohort, createIngestion, DomainError, finalizeTimedAttempt, getAppSnapshot, moderateMark, recordDisplayLaunch, recordExamPreflight, recordWorkbookProgress, releaseResult, removeCohortMember, requestAccommodation, revokeAccommodation, revokeCohortWorkbookAssignment, revokeWorkbookAssignment, reviewIngestion, saveAnswer, saveMark, setCaseFlag, submitAttempt } from "@/lib/repository";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof DomainError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Visible Medicine API error", error);
  return Response.json({ error: "The education service could not complete this request." }, { status: 500 });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new DomainError("Sign in through the authorized education site to continue.", 401);
  return auth;
}

export async function GET(request: Request) {
  try {
    const workbookId = new URL(request.url).searchParams.get("workbookId") ?? undefined;
    return Response.json(await getAppSnapshot(await authenticate(), workbookId), { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 64_000) throw new DomainError("Request is too large.", 413);
    const body = await request.json() as Record<string, string | number | boolean | object | null>;
    const action = typeof body.action === "string" ? body.action : "";
    const auth = await authenticate();
    if (action === "save-answer") await saveAnswer(auth, body as Record<string, string | number | null>);
    else if (action === "add-annotation") await addAnnotation(auth, body as Record<string, string | number | null>);
    else if (action === "add-key-image") await addKeyImage(auth, body as Record<string, string | number | null>);
    else if (action === "set-case-flag") await setCaseFlag(auth, body);
    else if (action === "submit-attempt") await submitAttempt(auth, body as Record<string, string | number | null>);
    else if (action === "finalize-timed-attempt") await finalizeTimedAttempt(auth, body);
    else if (action === "create-ingestion") await createIngestion(auth, body as Record<string, string | number | null>);
    else if (action === "review-ingestion") await reviewIngestion(auth, body as Record<string, string | number | null>);
    else if (["create-workbook", "update-workbook-draft", "clone-workbook", "create-assessment-recovery-draft", "convert-teaching-to-exam", "publish-workbook", "request-workbook-review", "review-workbook", "delete-workbook-draft", "retire-published-workbook"].includes(action))
      throw new DomainError("Workbook authoring actions must be completed inside the institution-scoped Studio builder.", 409);
    else if (action === "assign-workbook") await assignWorkbook(auth, body);
    else if (action === "revoke-workbook-assignment") await revokeWorkbookAssignment(auth, body);
    else if (action === "create-cohort") await createCohort(auth, body);
    else if (action === "add-cohort-member") await addCohortMember(auth, body);
    else if (action === "remove-cohort-member") await removeCohortMember(auth, body);
    else if (action === "assign-cohort-workbook") await assignCohortWorkbook(auth, body);
    else if (action === "revoke-cohort-workbook-assignment") await revokeCohortWorkbookAssignment(auth, body);
    else if (action === "record-workbook-progress") await recordWorkbookProgress(auth, body);
    else if (action === "request-accommodation") await requestAccommodation(auth, body);
    else if (action === "approve-accommodation") await approveAccommodation(auth, body);
    else if (action === "revoke-accommodation") await revokeAccommodation(auth, body);
    else if (action === "record-display-launch") await recordDisplayLaunch(auth, body);
    else if (action === "record-exam-preflight") await recordExamPreflight(auth, body);
    else if (action === "save-mark") await saveMark(auth, body);
    else if (action === "moderate-mark") await moderateMark(auth, body as Record<string, string | number | null>);
    else if (action === "release-result") await releaseResult(auth, body as Record<string, string | number | null>);
    else throw new DomainError("Unknown education action.", 404);
    const selectedWorkbookId = typeof body.selectedWorkbookId === "string" ? body.selectedWorkbookId : undefined;
    return Response.json(await getAppSnapshot(auth, selectedWorkbookId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
