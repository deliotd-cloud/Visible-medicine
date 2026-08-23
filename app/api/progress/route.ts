import { getChatGPTUser } from "../../chatgpt-auth";
import { listProgress, saveProgress } from "../../../db/progress";
import { syncCourseCompletion } from "../../../lib/platform-governance";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  return Response.json({ progress: await listProgress(user.userId) });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });

  const value = body as Record<string, unknown>;
  const resourceType = value.resourceType;
  const resourceSlug = value.resourceSlug;
  const progress = value.progress;
  const lastPosition = value.lastPosition;
  if ((resourceType !== "atlas" && resourceType !== "course") || typeof resourceSlug !== "string" || !/^[a-z0-9-]{1,80}$/.test(resourceSlug) || !Number.isInteger(progress) || Number(progress) < 0 || Number(progress) > 100 || !Number.isInteger(lastPosition) || Number(lastPosition) < 0) {
    return Response.json({ error: "Invalid progress record" }, { status: 400 });
  }

  const saved = await saveProgress(user.userId, { resourceType, resourceSlug, progress: Number(progress), lastPosition: Number(lastPosition) });
  const completionId = resourceType === "course" && Number(progress) === 100
    ? await syncCourseCompletion({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName }, resourceSlug, progress)
    : null;
  return Response.json({ progress: saved, completionId });
}
