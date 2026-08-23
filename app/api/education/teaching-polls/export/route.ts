import { authenticateEducationApi, educationApiErrorResponse } from "@/lib/education-api";
import { exportTeachingPollAggregate } from "@/lib/teaching-poll-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const runId = new URL(request.url).searchParams.get("runId") ?? "";
    const body = await exportTeachingPollAggregate(await authenticateEducationApi(), runId);
    return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="didanix-teaching-poll-${runId.slice(0, 24)}.csv"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return educationApiErrorResponse(error); }
}
