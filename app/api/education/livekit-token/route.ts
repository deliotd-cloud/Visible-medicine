import {
  authenticateEducationApi,
  educationApiErrorResponse,
  readEducationJson,
} from "@/lib/education-api";
import { issueLiveKitClassroomCredentials } from "@/lib/livekit-classroom";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await authenticateEducationApi();
    const payload = await readEducationJson(request, 4_000);
    return Response.json(
      await issueLiveKitClassroomCredentials(auth, payload),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
