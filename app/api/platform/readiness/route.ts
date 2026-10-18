import { getAuthContext } from "@/lib/auth";
import { enforceRateLimit, getReadinessSnapshot, InstitutionOperationsError, saveReadinessCheck } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
async function auth() { const value = await getAuthContext(); if (!value) throw new InstitutionOperationsError("Education sign-in is required.", 401); return value; }
function failure(error: unknown) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders }); console.error("Readiness API error", { type: error instanceof Error ? error.name : "unknown" }); return Response.json({ error: "Readiness evidence could not be updated." }, { status: 500, headers: privateHeaders }); }
export async function GET() { try { return Response.json(await getReadinessSnapshot(await auth()), { headers: privateHeaders }); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 24_000,
      error: (message, status) => new InstitutionOperationsError(message, status),
      crossOriginMessage: "Cross-origin readiness changes are not allowed.",
      jsonMessage: "Send readiness changes as JSON.",
    });
    const actor = await auth();
    await enforceRateLimit(actor.userId, "readiness-write", 30, 60);
    if (input.action !== "save-check") throw new InstitutionOperationsError("Unknown readiness action.", 404);
    await saveReadinessCheck(actor, input);
    return Response.json(await getReadinessSnapshot(actor), { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
