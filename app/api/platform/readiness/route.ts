import { getAuthContext } from "@/lib/auth";
import { enforceRateLimit, getReadinessSnapshot, InstitutionOperationsError, saveReadinessCheck } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
async function auth() { const value = await getAuthContext(); if (!value) throw new InstitutionOperationsError("Education sign-in is required.", 401); return value; }
function failure(error: unknown) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status }); console.error("Readiness API error", error); return Response.json({ error: "Readiness evidence could not be updated." }, { status: 500 }); }
export async function GET() { try { return Response.json(await getReadinessSnapshot(await auth()), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { const actor = await auth(); await enforceRateLimit(actor.userId, "readiness-write", 30, 60); const input = await request.json() as Record<string, unknown>; if (input.action !== "save-check") throw new InstitutionOperationsError("Unknown readiness action.", 404); await saveReadinessCheck(actor, input); return Response.json(await getReadinessSnapshot(actor), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return failure(error); } }
