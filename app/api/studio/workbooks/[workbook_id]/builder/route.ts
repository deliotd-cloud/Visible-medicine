import {
  authenticateEducationApi,
  EducationApiError,
  readEducationJson,
} from "@/lib/education-api";
import {
  DomainError,
  getAuthoringAppSnapshot,
  publishWorkbook,
  requestWorkbookReview,
  reviewWorkbook,
  updateWorkbookDraft,
} from "@/lib/repository";
import { isLectureWorkbook } from "@/lib/lecture-repository";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof EducationApiError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof DomainError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error("Visible Medicine Studio builder API error", error);
  return Response.json(
    { error: "The Studio builder could not complete this request." },
    { status: 500 },
  );
}

function normalizeWorkbookId(value: string) {
  const workbookId = decodeURIComponent(value).replace(/[^a-zA-Z0-9:_-]/g, "");
  if (!workbookId) throw new DomainError("A valid workbook is required.", 422);
  return workbookId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workbook_id: string }> },
) {
  try {
    const workbookId = normalizeWorkbookId((await params).workbook_id);
    return Response.json(
      await getAuthoringAppSnapshot(await authenticateEducationApi(), workbookId),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workbook_id: string }> },
) {
  try {
    const workbookId = normalizeWorkbookId((await params).workbook_id);
    const auth = await authenticateEducationApi();
    // Resolve authorization before applying a mutation. The lookup is scoped to
    // the user's active organization and deliberately returns a generic 404 for
    // workbooks outside that boundary.
    await getAuthoringAppSnapshot(auth, workbookId);
    if(await isLectureWorkbook(workbookId))
      throw new DomainError("Use the lecture editor for this content type.",409);

    const body = await readEducationJson(request, 64_000);
    const action = typeof body.action === "string" ? body.action : "";
    if (body.id !== workbookId)
      throw new DomainError("The requested workbook does not match this Studio builder.", 409);
    const scopedBody = { ...body, id: workbookId, selectedWorkbookId: workbookId };

    if (action === "update-workbook-draft")
      await updateWorkbookDraft(auth, scopedBody);
    else if (action === "request-workbook-review")
      await requestWorkbookReview(auth, scopedBody);
    else if (action === "review-workbook")
      await reviewWorkbook(auth, scopedBody);
    else if (action === "publish-workbook")
      await publishWorkbook(auth, scopedBody);
    else
      throw new DomainError("This action is not available in focused Studio authoring.", 404);

    return Response.json(await getAuthoringAppSnapshot(auth, workbookId), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
