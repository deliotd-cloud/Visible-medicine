import { env } from "cloudflare:workers";
import { getAuthContext } from "@/lib/auth";
import { appendAudit } from "@/db/bootstrap";
import { getPlatformSnapshot, PlatformAccessError } from "@/db/platform";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };
function accessFailure(error: unknown): Response {
  if (!(error instanceof PlatformAccessError)) throw error;
  return Response.json({ error: "Institution workspace access is unavailable.", code: "PLATFORM_ACCESS_UNAVAILABLE" }, { status: 403, headers: privateHeaders });
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return Response.json({ error: "Education sign-in is required." }, { status: 401, headers: privateHeaders });
    const snapshot = await getPlatformSnapshot(auth);
    return Response.json({ origins: snapshot.embedOrigins, enabled: snapshot.entitlement.embedsAccess }, { headers: privateHeaders });
  } catch (error) { return accessFailure(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();
    if (!auth) return Response.json({ error: "Education sign-in is required." }, { status: 401, headers: privateHeaders });
    const snapshot = await getPlatformSnapshot(auth);
    if (!snapshot.educationRoles.includes("administrator")) return Response.json({ error: "An organisation administrator is required." }, { status: 403, headers: privateHeaders });
    if (!snapshot.entitlement.embedsAccess) return Response.json({ error: "Embedded delivery is not included in this entitlement." }, { status: 403, headers: privateHeaders });
  
    let input: { origin?: unknown };
    try { input = await request.json() as { origin?: unknown }; }
    catch { return Response.json({ error: "A JSON request body is required." }, { status: 400, headers: privateHeaders }); }
    if (typeof input.origin !== "string") return Response.json({ error: "An HTTPS origin is required." }, { status: 422, headers: privateHeaders });
  
    let parsed: URL;
    try { parsed = new URL(input.origin); }
    catch { return Response.json({ error: "Enter a valid origin such as https://learn.example.edu." }, { status: 422, headers: privateHeaders }); }
    if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password)
      return Response.json({ error: "Use an HTTPS origin without a path, query, credentials or fragment." }, { status: 422, headers: privateHeaders });
    const origin = parsed.origin.toLowerCase();
    if (origin.length > 240) return Response.json({ error: "The origin is too long." }, { status: 422, headers: privateHeaders });
  
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO approved_embed_origins (id, organization_id, origin, status, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(organization_id, origin) DO UPDATE SET status = excluded.status`).bind(crypto.randomUUID(), snapshot.organization.id, origin, "evaluation", now).run();
    await appendAudit(auth.userId, "approve-embed-origin", "organization", snapshot.organization.id, "success", origin);
    const updated = await getPlatformSnapshot(auth);
    return Response.json({ origins: updated.embedOrigins }, { headers: privateHeaders });
  } catch (error) { return accessFailure(error); }
}
