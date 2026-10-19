import { getAuthContext } from "@/lib/auth";
import { sha256 } from "@/lib/domain";
import { enforceRateLimit, InstitutionOperationsError, submitPilotApplication } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 24_000,
      error: (message, status) => new InstitutionOperationsError(status === 413 ? "The pilot brief is too large." : message, status),
      crossOriginMessage: "Cross-origin pilot requests are not allowed.",
      jsonMessage: "JSON is required.",
    });
    const auth = await getAuthContext();
    const peer = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unavailable";
    const actor = auth?.userId ?? `anonymous:${(await sha256(`pilot:${peer}`)).slice(0, 24)}`;
    await enforceRateLimit(actor, "pilot-application", 5, 3600);
    return Response.json(await submitPilotApplication(auth, input), { status: 201, headers: privateHeaders });
  } catch (error) {
    if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
    console.error("Pilot application error", { type: error instanceof Error ? error.name : "unknown" }); return Response.json({ error: "The pilot brief could not be recorded." }, { status: 500, headers: privateHeaders });
  }
}
