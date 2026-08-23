import { PlatformGovernanceError, validateEmbedLaunch } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";

function cors(origin: string) {
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "private, no-store", Vary: "Origin" };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") ?? "null";
  return new Response(null, { status: 204, headers: cors(origin) });
}

export async function POST(request: Request) {
  let parentOrigin = "";
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 8_000) throw new PlatformGovernanceError("The launch request is too large.", 413);
    const input = await request.json() as Record<string, unknown>;
    parentOrigin = typeof input.parentOrigin === "string" ? input.parentOrigin.toLowerCase() : "";
    const session = await validateEmbedLaunch(input.token, parentOrigin);
    return Response.json({ session }, { headers: cors(parentOrigin) });
  } catch (error) {
    const message = error instanceof PlatformGovernanceError ? error.message : "The embedded launch could not be validated.";
    const status = error instanceof PlatformGovernanceError ? error.status : 500;
    return Response.json({ error: message }, { status, headers: cors(parentOrigin || "null") });
  }
}
