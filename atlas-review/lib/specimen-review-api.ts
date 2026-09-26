import {
  authenticatedReviewer,
  reviewBody,
  reviewJson,
  ReviewHttpError,
} from "./review-http";
import { specimenReviewMaterial } from "./specimen-review-material";
import {
  specimenReviewHistory,
  appendSpecimenReview,
} from "./specimen-review-store";
import {
  isSpecimenReviewTrack,
  specimenReviewScope,
  specimenApprovalProblems,
  type SavedSpecimenReview,
} from "./specimen-review";
import { validateBodyReviewDraft } from "./body-review-decisions";

function failure(e: unknown) {
  if (e instanceof ReviewHttpError)
    return reviewJson({ error: e.message }, e.status);
  console.error(JSON.stringify({ event: "specimen-review-storage-failed" }));
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
      "Private specimen review storage is unavailable. Keep your edits.",
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
    throw new ReviewHttpError(400, "Choose an exact specimen and structure.");
  const packet = await specimenReviewMaterial(key, id);
  if (!packet)
    throw new ReviewHttpError(
      404,
      "This selection is not in the independent-specimen review scope.",
    );
  return packet.context;
}
export async function getSpecimenReviews(
  request: Request,
  binding: D1Database | undefined,
) {
  try {
    const user = authenticatedReviewer(request.headers),
      q = new URL(request.url).searchParams;
    if (
      ["specimenKey", "structureId", "track", "before"].some(
        (k) => q.getAll(k).length > 1,
      )
    )
      throw new ReviewHttpError(400, "Duplicate review parameter.");
    const track = q.get("track"),
      before = Number(q.get("before") ?? 2147483648);
    if (
      !isSpecimenReviewTrack(track) ||
      !Number.isSafeInteger(before) ||
      before < 1 ||
      before > 2147483648
    )
      throw new ReviewHttpError(400, "Invalid track or history cursor.");
    const context = await contextFor(
      q.get("specimenKey"),
      q.get("structureId"),
    );
    const history = await specimenReviewHistory(
      database(binding),
      user,
      context.specimenKey,
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
export async function postSpecimenReview(
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
      i.catalogScope !== specimenReviewScope ||
      !isSpecimenReviewTrack(track) ||
      typeof expected !== "number" ||
      !Number.isSafeInteger(expected) ||
      expected < 0 ||
      expected > 2147483646
    )
      throw new ReviewHttpError(400, "Invalid scope, track or version.");
    const c = await contextFor(i.specimenKey, i.structureId);
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
      const problems = specimenApprovalProblems(draft, c, track);
      if (problems.length) throw new ReviewHttpError(422, problems.join(" "));
    }
    const db = database(binding),
      previous = (
        await specimenReviewHistory(
          db,
          user,
          c.specimenKey,
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
    const review: SavedSpecimenReview = {
      ...draft,
      eventSchema: "vm-specimen-review-event-1",
      catalogScope: specimenReviewScope,
      specimenKey: c.specimenKey,
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
    if (!(await appendSpecimenReview(db, user, review, expected)))
      throw new ReviewHttpError(
        409,
        "Another save won the version check. Refresh history before retrying.",
      );
    return reviewJson({ review }, 201);
  } catch (e) {
    return failure(e);
  }
}
