import { getAuthContext } from "@/lib/auth";
import {
  EducationPlatformError,
  enrolInCourse,
  getLearnerEnrolments,
  getLearnerProfile,
  saveLearnerProfile,
} from "@/lib/education-platform";
import { enforceRateLimit, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const headers = { "Cache-Control": "private, no-store" };
  if (error instanceof EducationPlatformError || error instanceof InstitutionOperationsError)
    return Response.json({ error: error.message }, { status: error.status, headers });
  console.error("Visible Medicine learner account error", { type: error instanceof Error ? error.name : "unknown" });
  return Response.json({ error: "The learner account service could not complete this request." }, { status: 500, headers });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new EducationPlatformError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try {
    const auth = await authenticate();
    const [profile, enrolments] = await Promise.all([getLearnerProfile(auth), getLearnerEnrolments(auth)]);
    return Response.json({ profile, enrolments }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 24_000,
      error: (message, status) => new EducationPlatformError(message, status),
      crossOriginMessage: "Cross-origin account changes are not allowed.",
      jsonMessage: "Send account changes as JSON.",
    });
    const auth = await authenticate();
    await enforceRateLimit(auth.userId, "learner-account", 20, 60);
    if (input.action === "save-profile") {
      const profile = await saveLearnerProfile(auth, input);
      return Response.json({ profile }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (input.action === "enrol") {
      const enrolment = await enrolInCourse(auth, input.releaseId, input.invitationCode);
      return Response.json({ enrolment }, { headers: { "Cache-Control": "private, no-store" } });
    }
    throw new EducationPlatformError("Unknown learner account action.", 404);
  } catch (error) { return failure(error); }
}
