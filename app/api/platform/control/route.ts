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

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof PlatformGovernanceError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Elivion platform control error", error);
  return Response.json({ error: "The institution control could not complete this request." }, { status: 500 });
}

async function authenticate() {
  const auth = await getAuthContext();
  if (!auth) throw new PlatformGovernanceError("Education sign-in is required.", 401);
  return auth;
}

export async function GET() {
  try { return Response.json(await getControlCentreSnapshot(await authenticate()), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 48_000) throw new PlatformGovernanceError("The request is too large.", 413);
    const input = await request.json() as Record<string, unknown>;
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
    return Response.json({ snapshot: await getControlCentreSnapshot(auth), launch }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
