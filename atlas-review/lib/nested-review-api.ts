import {
  authenticatedReviewer,
  reviewBody,
  reviewJson,
  ReviewHttpError,
} from "./review-http";
import { nestedReviewMaterial } from "./nested-review-material";
import {
  nestedReviewHistory,
  appendNestedReview,
} from "./nested-review-store";
import {
  isNestedReviewTrack,
  nestedReviewScope,
  nestedApprovalProblems,
  type SavedNestedReview,
} from "./nested-review";
import { validateBodyReviewDraft } from "./body-review-decisions";

function failure(e: unknown) {
  if (e instanceof ReviewHttpError)
    return reviewJson({ error: e.message }, e.status);
  console.error(JSON.stringify({ event: "nested-review-storage-failed" }));
  return reviewJson(
    {
      error:
        "Save state could not be confirmed. Keep or export your edits, then refresh saved history before retrying.",
    },
    503,
  );
}
function database(db: D1Database | undefined) {
  if (!db)
    throw new ReviewHttpError(
      503,
      "Private nested review storage is unavailable. Keep your edits.",
    );
  return db;
}
async function contextFor(key: unknown, id: unknown) {
  if (
    typeof key !== "string" ||
    typeof id !== "string" ||
    !key ||
    !id ||
    key.length > 256 ||
    id.length > 256
  )
    throw new ReviewHttpError(400, "Choose an exact parent, study and child structure.");
  const packet = await nestedReviewMaterial(key, id);
  if (!packet)
    throw new ReviewHttpError(
      404,
      "This selection is not in the nested-dissection review scope.",
    );
  return packet.context;
}
export async function getNestedReviews(
  request: Request,
  binding: D1Database | undefined,
) {
  try {
    const user = authenticatedReviewer(request.headers),
      q = new URL(request.url).searchParams;
    if (
      ["nestedKey", "structureId", "track", "before"].some(
        (k) => q.getAll(k).length > 1,
      )
    )
      throw new ReviewHttpError(400, "Duplicate review parameter.");
    const track = q.get("track"),
      before = Number(q.get("before") ?? 2147483648);
    if (
      !isNestedReviewTrack(track) || track === "imaging" ||
      !Number.isSafeInteger(before) ||
      before < 1 ||
      before > 2147483648
    )
      throw new ReviewHttpError(400, "Invalid track or history cursor.");
    const context = await contextFor(
      q.get("nestedKey"),
      q.get("structureId"),
    );
    const history = await nestedReviewHistory(
      database(binding),
      user,
      context.nestedKey,
      context.structureId,
      track,
      before,
    );
    return reviewJson({
      context,
      track,
      history,
      nextBefore: history.length === 20 ? history.at(-1)!.version : null,
      scope: "private-to-signed-in-user",
    });
  } catch (e) {
    return failure(e);
  }
}
export async function postNestedReview(
  request: Request,
  binding: D1Database | undefined,
) {
  try {
    const user = authenticatedReviewer(request.headers),
      raw = await reviewBody(request);
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new ReviewHttpError(400, "Invalid review.");
    const i = raw as Record<string, unknown>,
      track = i.track,
      expected = i.expectedVersion;
    if (
      i.catalogScope !== nestedReviewScope ||
      !isNestedReviewTrack(track) || track === "imaging" ||
      typeof expected !== "number" ||
      !Number.isSafeInteger(expected) ||
      expected < 0 ||
      expected > 2147483646
    )
      throw new ReviewHttpError(400, "Invalid scope, track or version.");
    const c = await contextFor(i.nestedKey, i.structureId);
    if (
      i.sourceFrame !== c.sourceFrame ||
      i.materialHash !== c.materialHash ||
      i.revisionHash !== c.revisions[track] ||
      i.checklistVersion !== c.checklistVersion
    )
      throw new ReviewHttpError(
        409,
        "Material changed. Export your edits, reload the worksheet and re-review the current material.",
      );
    let draft;
    try {
      draft = validateBodyReviewDraft(i.draft, c.checklists[track]);
    } catch (e) {
      throw new ReviewHttpError(
        422,
        e instanceof Error ? e.message : "Invalid draft.",
      );
    }
    if (draft.status === "approved") {
      const problems = nestedApprovalProblems(draft, c, track);
      if (problems.length) throw new ReviewHttpError(422, problems.join(" "));
    }
    const db = database(binding),
      previous = (
        await nestedReviewHistory(
          db,
          user,
          c.nestedKey,
          c.structureId,
          track,
        )
      )[0];
    if ((previous?.version ?? 0) !== expected)
      throw new ReviewHttpError(
        409,
        "Another save changed this review. Keep your edits and refresh saved history.",
      );
    if (
      previous?.issues.some(
        (issue) => !draft.issues.some((next) => next.id === issue.id),
      )
    )
      throw new ReviewHttpError(
        422,
        "Saved issues cannot be deleted. Resolve them with an explanation.",
      );
    const now = new Date().toISOString();
    const review: SavedNestedReview = {
      ...draft,
      eventSchema: "vm-nested-review-event-1",
      catalogScope: nestedReviewScope,
      nestedKey: c.nestedKey,
      sourceFrame: c.sourceFrame,
      structureId: c.structureId,
      track,
      version: expected + 1,
      savedAt: now,
      reviewedAt: draft.status === "approved" ? now : null,
      revisionHash: c.revisions[track],
      checklistVersion: c.checklistVersion,
      checklist: c.checklists[track],
      material: {
        materialHash: c.materialHash,
        sourceHash: c.sourceHash,
        teachingHash: c.teachingHash,
        rendererHash: c.rendererHash,
        teachingTabs: c.teachingTabs,
      },
    };
    if (!(await appendNestedReview(db, user, review, expected)))
      throw new ReviewHttpError(
        409,
        "Another save won the version check. Refresh history before retrying.",
      );
    return reviewJson({ review }, 201);
  } catch (e) {
    return failure(e);
  }
}
