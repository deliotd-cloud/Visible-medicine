import {
  authenticateEducationApi,
  educationApiErrorResponse,
  readEducationJson,
} from "@/lib/education-api";
import {
  getEducationIntegrations,
  saveLtiDraft,
} from "@/lib/education-integration-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      await getEducationIntegrations(await authenticateEducationApi()),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readEducationJson(request, 24_000);
    if (payload.action !== "save-draft")
      return Response.json({ error: "Unknown integration action." }, { status: 404 });
    return Response.json(
      await saveLtiDraft(
        await authenticateEducationApi(),
        payload.configuration,
        payload.expectedVersion,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return educationApiErrorResponse(error);
  }
}
