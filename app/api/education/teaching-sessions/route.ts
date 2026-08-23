import {
  authenticateEducationApi,
  educationApiErrorResponse,
  readEducationJson,
} from "@/lib/education-api";
import {
  endTeachingSession,
  getTeachingSessionBundle,
  heartbeatTeachingSession,
  startTeachingSession,
  updateTeachingSession,
} from "@/lib/teaching-session-repository";
import { notifyTeachingLiveWorkbook } from "@/lib/teaching-live-transport";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workbookId =
      new URL(request.url).searchParams.get("workbookId") ?? undefined;
    return Response.json(
      await getTeachingSessionBundle(
        await authenticateEducationApi(),
        workbookId,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readEducationJson(request, 24_000);
    const auth = await authenticateEducationApi();
    const result =
      payload.action === "start"
        ? await startTeachingSession(auth, payload)
        : payload.action === "update"
          ? await updateTeachingSession(auth, payload)
          : payload.action === "end"
            ? await endTeachingSession(auth, payload)
            : payload.action === "heartbeat"
              ? await heartbeatTeachingSession(auth, payload)
              : null;
    if (!result)
      return Response.json(
        { error: "Unknown teaching session action." },
        { status: 404 },
      );
    if (payload.action !== "heartbeat") {
      const workbookId = result.session?.workbookId ??
        (typeof payload.workbookId === "string" ? payload.workbookId : "");
      if (workbookId) await notifyTeachingLiveWorkbook(workbookId);
    }
    return Response.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
