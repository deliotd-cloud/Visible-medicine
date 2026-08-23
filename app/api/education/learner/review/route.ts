import {
  authenticateEducationApi,
  educationApiErrorResponse,
} from "@/lib/education-api";
import { getLearnerReview } from "@/lib/learner-review-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workbookId = new URL(request.url).searchParams.get("workbookId") ?? "";
    return Response.json(
      await getLearnerReview(await authenticateEducationApi(), workbookId),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
