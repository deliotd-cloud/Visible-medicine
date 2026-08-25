import { getAuthContext } from "@/lib/auth";
import { createOrganizationInvitations, enforceRateLimit, getPeopleSnapshot, InstitutionOperationsError } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
async function auth() { const value = await getAuthContext(); if (!value) throw new InstitutionOperationsError("Education sign-in is required.", 401); return value; }
function failure(error: unknown) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status }); console.error("Institution people error", error); return Response.json({ error: "The institution roster could not be updated." }, { status: 500 }); }
export async function GET() { try { return Response.json(await getPeopleSnapshot(await auth()), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { if (Number(request.headers.get("content-length") ?? 0) > 64_000) throw new InstitutionOperationsError("The roster is too large.", 413); const actor = await auth(); await enforceRateLimit(actor.userId, "institution-people", 12, 60); const input = await request.json() as Record<string, unknown>; if (input.action !== "invite") throw new InstitutionOperationsError("Unknown people action.", 404); const created = await createOrganizationInvitations(actor, input); return Response.json({ ...created, snapshot: await getPeopleSnapshot(actor) }, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return failure(error); } }
