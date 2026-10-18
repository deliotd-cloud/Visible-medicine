import { getAuthContext } from "@/lib/auth";
import { createOrganizationInvitations, enforceRateLimit, getPeopleSnapshot, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
async function auth() { const value = await getAuthContext(); if (!value) throw new InstitutionOperationsError("Education sign-in is required.", 401); return value; }
function failure(error: unknown) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders }); console.error("Institution people error", { type: error instanceof Error ? error.name : "unknown" }); return Response.json({ error: "The institution roster could not be updated." }, { status: 500, headers: privateHeaders }); }
export async function GET() { try { return Response.json(await getPeopleSnapshot(await auth()), { headers: privateHeaders }); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 64_000,
      error: (message, status) => new InstitutionOperationsError(status === 413 ? "The roster is too large." : message, status),
      crossOriginMessage: "Cross-origin roster changes are not allowed.",
      jsonMessage: "Send roster changes as JSON.",
    });
    const actor = await auth();
    await enforceRateLimit(actor.userId, "institution-people", 12, 60);
    if (input.action !== "invite") throw new InstitutionOperationsError("Unknown people action.", 404);
    const created = await createOrganizationInvitations(actor, input);
    return Response.json({ ...created, snapshot: await getPeopleSnapshot(actor) }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
