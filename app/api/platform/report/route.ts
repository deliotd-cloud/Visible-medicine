import { getChatGPTUser } from "@/app/chatgpt-auth";
import { InstitutionOperationsError, institutionProgressCsv } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  try {
    // Export contains learner information: never fall back to a local demo actor.
    const user = await getChatGPTUser();
    if (!user) throw new InstitutionOperationsError("Education sign-in is required.", 401);
    const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
    // The existing service remains responsible for administrator and organization scope.
    const csv = await institutionProgressCsv(auth);
    return new Response(`\uFEFF${csv}`, { headers: {
      ...headers, "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="visible-medicine-progress-${new Date().toISOString().slice(0, 10)}.csv"`,
    } });
  } catch (error) {
    if (error instanceof InstitutionOperationsError) return Response.json({ error: error.message }, { status: error.status, headers });
    console.error("Institution report error", { type: error instanceof Error ? error.name : "unknown" });
    return Response.json({ error: "The report could not be generated." }, { status: 500, headers });
  }
}
