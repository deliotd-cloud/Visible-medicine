import { getAuthContext } from "@/lib/auth";
import {
  EducationPlatformError,
  enrolInCourse,
  getLearnerEnrolments,
  getLearnerProfile,
  saveLearnerProfile,
} from "@/lib/education-platform";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof EducationPlatformError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Elivion learner account error", error);
  return Response.json({ error: "The learner account service could not complete this request." }, { status: 500 });
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
    if (Number(request.headers.get("content-length") ?? 0) > 24_000) throw new EducationPlatformError("The request is too large.", 413);
    const input = await request.json() as Record<string, unknown>;
    const auth = await authenticate();
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
