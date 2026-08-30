import { getAuthContext } from "@/lib/auth";
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
} from "@/lib/education-platform";
import { enforceRateLimit } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof EducationPlatformError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Visible Medicine Studio API error", error);
  return Response.json({ error: "Studio could not complete this request." }, { status: 500 });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new EducationPlatformError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try { return Response.json(await getStudioSnapshot(await authenticate()), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 48_000) throw new EducationPlatformError("The request is too large.", 413);
    const input = await request.json() as Record<string, unknown>;
    const action = typeof input.action === "string" ? input.action : "";
    const auth = await authenticate();
    await enforceRateLimit(auth.userId, "studio-write", 45, 60);
    let result: Record<string, unknown> = {};
    if (action === "create-course") result = { courseId: await createStudioCourse(auth, input) };
    else if (action === "create-course-from-template") result = { courseId: await createStudioCourseFromTemplate(auth, input) };
    else if (action === "duplicate-course") result = { courseId: await duplicateStudioCourse(auth, input) };
    else if (action === "create-workbook") result = { workbookId: await createStudioWorkbook(auth, input) };
    else if (action === "duplicate-workbook") result = { workbookId: await duplicateStudioWorkbook(auth, input) };
    else if (action === "create-cohort") result = { cohortId: await createStudioCohort(auth, input) };
    else if (action === "assign-cohort-workbook") await assignStudioCohortWorkbook(auth, input);
    else if (action === "save-release") result = { releaseId: await saveCourseReleaseDraft(auth, input) };
    else if (action === "submit-release") await submitCourseRelease(auth, input.releaseId);
    else if (action === "review-release") await reviewCourseRelease(auth, input);
    else if (action === "publish-release") await publishCourseRelease(auth, input.releaseId);
    else if (action === "create-invitation") result = { invitationCode: await createCourseInvitation(auth, input) };
    else throw new EducationPlatformError("Unknown Studio action.", 404);
    return Response.json({ ...result, snapshot: await getStudioSnapshot(auth) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
