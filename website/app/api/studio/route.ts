import { getAuthContext } from "@/lib/auth";
import { PlatformAccessError } from "@/db/platform";
import {
  createCourseInvitation,
  assignStudioCohortWorkbook,
  createStudioCohort,
  createStudioCourse,
  createStudioCourseFromTemplate,
  createStudioWorkbook,
  duplicateStudioCourse,
  duplicateStudioWorkbook,
  EducationPlatformError,
  getStudioSnapshot,
  publishCourseRelease,
  reviewCourseRelease,
  saveCourseReleaseDraft,
  submitCourseRelease,
  updateStudioCourse,
} from "@/lib/education-platform";
import { enforceRateLimit, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";
import { requiresStudioMutationContext, StudioMutationContextError } from "@/lib/studio-mutation-context";
import { assertStudioMutationContext } from "@/lib/studio-mutation-context-server";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const headers = { "Cache-Control": "private, no-store" };
  if (error instanceof StudioMutationContextError)
    return Response.json({error:error.message,code:error.reason==='changed'?'STUDIO_CONTEXT_CHANGED':'STUDIO_CONTEXT_UNAVAILABLE'},{status:error.reason==='changed'?409:503,headers});
  if (error instanceof EducationPlatformError || error instanceof InstitutionOperationsError || error instanceof PlatformAccessError)
    return Response.json({ error: error.message }, { status: error.status, headers });
  console.error("Visible Medicine Studio API error", { type: error instanceof Error ? error.name : "unknown" });
  return Response.json({ error: "Studio could not complete this request." }, { status: 500, headers });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new EducationPlatformError("Education sign-in is required.", 401);
  return auth;
}

export async function GET(request?: Request) {
  try {
    if(request&&new URL(request.url).searchParams.get('mutationContext')==='1'){
      const auth=await authenticate(),raw=request.headers.get('X-Studio-Mutation-Context');
      let expected:unknown;try{if(!raw||raw.length>2048)throw Error();expected=JSON.parse(raw);}catch{throw new StudioMutationContextError();}
      await assertStudioMutationContext(auth,expected);
      return Response.json({ok:true,action:'verify-studio-mutation-context'},{headers:{'Cache-Control':'private, no-store'}});
    }
    return Response.json(await getStudioSnapshot(await authenticate()), { headers: { "Cache-Control": "private, no-store" } });
  }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 48_000,
      error: (message, status) => new EducationPlatformError(message, status),
      crossOriginMessage: "Cross-origin Studio changes are not allowed.",
      jsonMessage: "Send Studio changes as JSON.",
    });
    const action = typeof input.action === "string" ? input.action : "";
    const auth = await authenticate();
    if(requiresStudioMutationContext(action)||Object.hasOwn(input,'expectedStudioContext'))
      await assertStudioMutationContext(auth,input.expectedStudioContext);
    await enforceRateLimit(auth.userId, "studio-write", 45, 60);
    let result: Record<string, unknown> = {};
    if (action === "create-course") result = { courseId: await createStudioCourse(auth, input) };
    else if (action === "update-course") result = { courseId: await updateStudioCourse(auth, input) };
    else if (action === "create-course-from-template") result = { courseId: await createStudioCourseFromTemplate(auth, input) };
    else if (action === "duplicate-course") result = { courseId: await duplicateStudioCourse(auth, input) };
    else if (action === "create-workbook") result = { workbookId: await createStudioWorkbook(auth, input) };
    else if (action === "duplicate-workbook") result = { workbookId: await duplicateStudioWorkbook(auth, input) };
    else if (action === "create-cohort") result = { cohortId: await createStudioCohort(auth, input) };
    else if (action === "assign-cohort-workbook") await assignStudioCohortWorkbook(auth, input);
    else if (action === "save-release") result = { releaseId: await saveCourseReleaseDraft(auth, input) };
    else if (action === "submit-release") await submitCourseRelease(auth, input);
    else if (action === "review-release") await reviewCourseRelease(auth, input);
    else if (action === "publish-release") await publishCourseRelease(auth, input);
    else if (action === "create-invitation") result = { invitationCode: await createCourseInvitation(auth, input) };
    else throw new EducationPlatformError("Unknown Studio action.", 404);
    // Mutations have committed at this point. A separate snapshot read must
    // not turn that success into a retryable failure (or lose a one-time code).
    // Studio refreshes its server-rendered view after this acknowledgement.
    return Response.json({ ok: true, action, ...result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
