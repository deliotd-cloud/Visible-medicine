import { getAuthContext } from "@/lib/auth";
import { completeLearnerReview, getLearnerPortfolio, getLearnerPortfolioPage, PlatformGovernanceError, saveLearnerNote, scheduleLearnerReview } from "@/lib/platform-governance";
import { parsePortfolioSection } from "@/lib/learner-portfolio-pagination";
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

export async function GET(request?: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const params = url?.searchParams;
    const section = params?.get("section");
    const cursor = params?.get("cursor");
    const auth = await authenticate();
    if (!section && !cursor) return Response.json(await getLearnerPortfolio(auth), { headers: responseHeaders });
    if (params?.size !== 2 || !section || !cursor) throw new PlatformGovernanceError("Invalid learning history request.", 400);
    let selected: "notes" | "reviews";
    try { selected = parsePortfolioSection(section); }
    catch { throw new PlatformGovernanceError("Invalid learning history section.", 400); }
    try { return Response.json(await getLearnerPortfolioPage(auth, selected, cursor), { headers: responseHeaders }); }
    catch (error) { if (error instanceof Error && error.message === "Invalid learning history cursor.") throw new PlatformGovernanceError(error.message, 400); throw error; }
  }
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
