import { getAuthContext } from "@/lib/auth";
import { createAccountRequest, enforceRateLimit, exportLearnerData, InstitutionOperationsError } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
async function auth() { const value = await getAuthContext(); if (!value) throw new InstitutionOperationsError("Education sign-in is required.", 401); return value; }
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
function failure(error: unknown) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders }); console.error("Learner data API error", { type: error instanceof Error ? error.name : "unknown" }); return Response.json({ error: "The learner-data request could not be completed." }, { status: 500, headers: privateHeaders }); }
export async function GET() { try { const actor = await auth(); const data = await exportLearnerData(actor); return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="visible-medicine-data-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } }); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 12_000,
      error: (message, status) => new InstitutionOperationsError(message, status),
      crossOriginMessage: "Cross-origin account requests are not allowed.",
      jsonMessage: "Send account requests as JSON.",
    });
    const actor = await auth();
    await enforceRateLimit(actor.userId, "account-request", 6, 3600);
    const requestResult = await createAccountRequest(actor, input);
    const data = await exportLearnerData(actor);
    return Response.json({ request: requestResult, requests: data.requests }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
