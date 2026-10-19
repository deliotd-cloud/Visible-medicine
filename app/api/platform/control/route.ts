import { getAuthContext } from "@/lib/auth";
import {
  addAtlasAnnotation,
  createAtlasDraft,
  getControlCentreSnapshot,
  issueEmbedLaunch,
  PlatformGovernanceError,
  publishAtlasPublication,
  reviewAtlasPublication,
  saveBillingIntent,
  saveIdentityDraft,
  saveOrganizationProfile,
  submitAtlasForReview,
} from "@/lib/platform-governance";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

function failure(error: unknown) {
  if (error instanceof PlatformGovernanceError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
  console.error("Visible Medicine platform control error", { type: error instanceof Error ? error.name : "unknown" });
  return Response.json({ error: "The institution control could not complete this request." }, { status: 500, headers: privateHeaders });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new PlatformGovernanceError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try { return Response.json(await getControlCentreSnapshot(await authenticate()), { headers: privateHeaders }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 48_000,
      error: (message, status) => new PlatformGovernanceError(message, status),
      crossOriginMessage: "Cross-origin institution changes are not allowed.",
      jsonMessage: "Send institution changes as JSON.",
    });
    const action = typeof input.action === "string" ? input.action : "";
    const auth = await authenticate();
    let launch: Awaited<ReturnType<typeof issueEmbedLaunch>> | undefined;
    if (action === "save-organization-profile") await saveOrganizationProfile(auth, input);
    else if (action === "save-identity-draft") await saveIdentityDraft(auth, input);
    else if (action === "create-atlas-draft") await createAtlasDraft(auth, input);
    else if (action === "add-atlas-annotation") await addAtlasAnnotation(auth, input);
    else if (action === "submit-atlas-review") await submitAtlasForReview(auth, input.publicationId);
    else if (action === "review-atlas-publication") await reviewAtlasPublication(auth, input);
    else if (action === "publish-atlas-publication") await publishAtlasPublication(auth, input.publicationId);
    else if (action === "save-billing-intent") await saveBillingIntent(auth, input);
    else if (action === "issue-embed-launch") launch = await issueEmbedLaunch(auth, input);
    else throw new PlatformGovernanceError("Unknown institution action.", 404);
    return Response.json({ snapshot: await getControlCentreSnapshot(auth), launch }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
