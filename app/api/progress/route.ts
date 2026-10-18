import { getChatGPTUser } from "@/app/chatgpt-auth";
import { listProgress, saveProgress } from "@/db/progress";
import { syncCourseCompletion } from "@/lib/platform-governance";
import { readBoundedMutationJson } from "@/lib/mutation-json";

export const dynamic = "force-dynamic";

const privateHeaders = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: privateHeaders });

class ProgressRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function failure(error: unknown) {
  if (error instanceof ProgressRequestError) return json({ error: error.message }, error.status);
  console.error("Progress request failed", { type: error instanceof Error ? error.name : typeof error });
  return json({ error: "Unable to save or load progress. Please try again." }, 500);
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return json({ error: "Authentication required" }, 401);
    return json({ progress: await listProgress(user.userId) });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const value = await readBoundedMutationJson(request, {
      maxBytes: 4000,
      error: (message, status) => new ProgressRequestError(message, status),
      crossOriginMessage: "Cross-origin progress requests are not allowed.",
      jsonMessage: "A JSON progress request is required.",
    });
    const user = await getChatGPTUser();
    if (!user) return json({ error: "Authentication required" }, 401);

    const { resourceType, resourceSlug, progress, lastPosition } = value;
    if ((resourceType !== "atlas" && resourceType !== "course") || typeof resourceSlug !== "string" || !/^[a-z0-9-]{1,80}$/.test(resourceSlug) || !Number.isInteger(progress) || Number(progress) < 0 || Number(progress) > 100 || !Number.isSafeInteger(lastPosition) || Number(lastPosition) < 0) {
      return json({ error: "Invalid progress record" }, 400);
    }

    const saved = await saveProgress(user.userId, { resourceType, resourceSlug, progress: Number(progress), lastPosition: Number(lastPosition) });
    let completionId: string | null = null;
    // A bookmark which preserves existing100% is not a new human attestation.
    // Only an explicit100 request may create an education-only completion record.
    if (resourceType === "course" && Number(progress) === 100) {
      try {
        completionId = await syncCourseCompletion({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName }, resourceSlug, progress);
      } catch (error) {
        // Progress has already committed. A separate completion failure must
        // not report that write as failed or invent a confirmed certificate.
        console.error("Course completion could not be confirmed", { type: error instanceof Error ? error.name : typeof error });
      }
    }
    return json({ progress: saved, completionId });
  } catch (error) { return failure(error); }
}
