import { getAuthContext } from "@/lib/auth";
import { acceptOrganizationInvitation, enforceRateLimit, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 4_000,
      error: (message, status) => new InstitutionOperationsError(message, status),
      crossOriginMessage: "Cross-origin invitation requests are not allowed.",
      jsonMessage: "Send invitation requests as JSON.",
    });
    const auth = await getAuthContext();
    if (!auth) throw new InstitutionOperationsError("Education sign-in is required.", 401);
    await enforceRateLimit(auth.userId, "accept-organization-invitation", 8, 300);
    return Response.json(await acceptOrganizationInvitation(auth, input.token), { headers: privateHeaders });
  } catch (error) {
    if (error instanceof InstitutionOperationsError)
      return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
    console.error("Invitation acceptance error", { type: error instanceof Error ? error.name : "unknown" });
    return Response.json({ error: "The invitation could not be accepted." }, { status: 500, headers: privateHeaders });
  }
}
