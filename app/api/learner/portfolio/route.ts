import { getAuthContext } from "@/lib/auth";
import { completeLearnerReview, getLearnerPortfolio, PlatformGovernanceError, saveLearnerNote, scheduleLearnerReview } from "@/lib/platform-governance";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

function failure(error: unknown) {
  if (error instanceof PlatformGovernanceError) return Response.json({ error: error.message }, { status: error.status, headers: responseHeaders });
  return Response.json({ error: "The learner record could not be updated." }, { status: 500, headers: responseHeaders });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new PlatformGovernanceError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try { return Response.json(await getLearnerPortfolio(await authenticate()), { headers: responseHeaders }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 12_000,
      error: (message, status) => new PlatformGovernanceError(message, status),
      crossOriginMessage: "Cross-origin portfolio changes are not allowed.",
      jsonMessage: "Send portfolio changes as JSON.",
    });
    const auth = await authenticate();
    if (input.action === "save-note") await saveLearnerNote(auth, input);
    else if (input.action === "schedule-review") await scheduleLearnerReview(auth, input);
    else if (input.action === "complete-review") await completeLearnerReview(auth, input.reviewId);
    else throw new PlatformGovernanceError("Unknown learner action.", 404);
    return Response.json(await getLearnerPortfolio(auth), { headers: responseHeaders });
  } catch (error) { return failure(error); }
}
