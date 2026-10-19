import { getAuthContext } from "@/lib/auth";
import { EducationPlatformError, getStudioInvitations, revokeStudioInvitation } from "@/lib/education-platform";
import { enforceRateLimit, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";
import { StudioMutationContextError } from "@/lib/studio-mutation-context";
import { assertStudioMutationContext } from "@/lib/studio-mutation-context-server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  if (error instanceof StudioMutationContextError) return Response.json({ code: error.reason === "changed" ? "STUDIO_CONTEXT_CHANGED" : "STUDIO_CONTEXT_UNAVAILABLE", error: error.message }, { status: error.reason === "changed" ? 409 : 503, headers });
  if (error instanceof EducationPlatformError || error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers });
  console.error("Studio invitation request failed", { type: error instanceof Error ? error.name : "unknown" });
  return Response.json({ error: "The invitation ledger is unavailable. Refresh it before continuing." }, { status: 500, headers });
}
async function actor() { const auth = await getAuthContext(); if (!auth) throw new EducationPlatformError("Education sign-in is required.", 401); return auth; }
export async function GET(request: Request) {
  try {
    const auth = await actor(), raw = request.headers.get("X-Studio-Mutation-Context");
    let expected: unknown; try { if (!raw || raw.length > 2048) throw Error(); expected = JSON.parse(raw); } catch { throw new StudioMutationContextError(); }
    await assertStudioMutationContext(auth, expected);
    await enforceRateLimit(auth.userId, "studio-invitations-read", 90, 60);
    const query = new URL(request.url).searchParams;
    if (["releaseId", "beforeCreatedAt", "beforeId"].some(key => query.getAll(key).length > 1) || [...query.keys()].some(key => !["releaseId", "beforeCreatedAt", "beforeId"].includes(key)))
      throw new EducationPlatformError("Choose a valid invitation ledger page.", 422);
    const hasCursor = query.has("beforeCreatedAt") || query.has("beforeId");
    const page = await getStudioInvitations(auth, query.get("releaseId"), hasCursor ? { createdAt: query.get("beforeCreatedAt"), id: query.get("beforeId") } : undefined);
    return Response.json({ ok: true, action: "list-course-invitations", ...page }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, { maxBytes: 8000, error: (message, status) => new EducationPlatformError(message, status), crossOriginMessage: "Cross-origin invitation changes are not allowed.", jsonMessage: "Send invitation changes as JSON." });
    const auth = await actor();
    await assertStudioMutationContext(auth, input.expectedStudioContext);
    if (input.action !== "revoke-course-invitation") throw new EducationPlatformError("Unknown invitation action.", 404);
    await enforceRateLimit(auth.userId, "studio-write", 45, 60);
    const invitationId = await revokeStudioInvitation(auth, input);
    return Response.json({ ok: true, action: "revoke-course-invitation", invitationId, status: "revoked" }, { headers });
  } catch (error) { return failure(error); }
}
