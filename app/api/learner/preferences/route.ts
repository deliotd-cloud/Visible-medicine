import { getAuthContext } from "@/lib/auth";
import { enforceRateLimit, InstitutionOperationsError, saveNotificationPreferences } from "@/lib/institution-operations";
import { readBoundedMutationJson } from "@/lib/mutation-json";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  try {
    const input = await readBoundedMutationJson(request, {
      maxBytes: 4_000,
      error: (message, status) => new InstitutionOperationsError(message, status),
      crossOriginMessage: "Cross-origin preference changes are not allowed.",
      jsonMessage: "Send preference changes as JSON.",
    });
    const auth = await getAuthContext();
    if (!auth) throw new InstitutionOperationsError("Education sign-in is required.", 401);
    await enforceRateLimit(auth.userId, "notification-preferences", 12, 60);
    return Response.json(await saveNotificationPreferences(auth, input), { headers: privateHeaders });
  } catch (error) {
    if (error instanceof InstitutionOperationsError)
      return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
    console.error("Notification preferences error", { type: error instanceof Error ? error.name : "unknown" });
    return Response.json({ error: "Preferences could not be saved." }, { status: 500, headers: privateHeaders });
  }
}
