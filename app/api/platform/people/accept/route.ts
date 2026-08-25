import { getAuthContext } from "@/lib/auth";
import { acceptOrganizationInvitation, enforceRateLimit, InstitutionOperationsError } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { const auth = await getAuthContext(); if (!auth) throw new InstitutionOperationsError("Education sign-in is required.", 401); await enforceRateLimit(auth.userId, "accept-organization-invitation", 8, 300); const input = await request.json() as Record<string, unknown>; return Response.json(await acceptOrganizationInvitation(auth, input.token), { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status }); console.error("Invitation acceptance error", error); return Response.json({ error: "The invitation could not be accepted." }, { status: 500 }); } }
