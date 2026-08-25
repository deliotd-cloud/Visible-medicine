import { getAuthContext } from "@/lib/auth";
import { sha256 } from "@/lib/domain";
import { enforceRateLimit, InstitutionOperationsError, submitPilotApplication } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) return Response.json({ error: "JSON is required." }, { status: 415 });
    if (Number(request.headers.get("content-length") ?? 0) > 24_000) return Response.json({ error: "The pilot brief is too large." }, { status: 413 });
    const auth = await getAuthContext();
    const peer = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unavailable";
    const actor = auth?.userId ?? `anonymous:${(await sha256(`pilot:${peer}`)).slice(0, 24)}`;
    await enforceRateLimit(actor, "pilot-application", 5, 3600);
    return Response.json(await submitPilotApplication(auth, await request.json() as Record<string, unknown>), { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Pilot application error", error); return Response.json({ error: "The pilot brief could not be recorded." }, { status: 500 });
  }
}
