import { getAuthContext } from "@/lib/auth";
import { completeLearnerReview, getLearnerPortfolio, PlatformGovernanceError, saveLearnerNote, scheduleLearnerReview } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof PlatformGovernanceError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: "The learner record could not be updated." }, { status: 500 });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new PlatformGovernanceError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try { return Response.json(await getLearnerPortfolio(await authenticate()), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 12_000) throw new PlatformGovernanceError("The request is too large.", 413);
    const input = await request.json() as Record<string, unknown>;
    const auth = await authenticate();
    if (input.action === "save-note") await saveLearnerNote(auth, input);
    else if (input.action === "schedule-review") await scheduleLearnerReview(auth, input);
    else if (input.action === "complete-review") await completeLearnerReview(auth, input.reviewId);
    else throw new PlatformGovernanceError("Unknown learner action.", 404);
    return Response.json(await getLearnerPortfolio(auth), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
