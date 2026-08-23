import {
  authenticateEducationApi,
  educationApiErrorResponse,
} from "@/lib/education-api";
import { getTeachingDashboard } from "@/lib/teaching-dashboard-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      await getTeachingDashboard(await authenticateEducationApi()),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
