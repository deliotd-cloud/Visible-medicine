import {
  blankNestedReview,
  parseSavedNestedReview,
  nestedReviewStale,
  type NestedReviewContext,
  type NestedReviewTrack,
  type SavedNestedReview,
} from "./nested-review";
export function parseNestedHistory(
  v: unknown,
  c: NestedReviewContext,
  track: NestedReviewTrack,
  before = 2147483648,
) {
  if (!v || typeof v !== "object") throw Error("Unexpected history response.");
  const page = v as {
    context?: NestedReviewContext;
    track?: string;
    scope?: string;
    history?: unknown[];
    nextBefore?: unknown;
  };
  if (
    page.scope !== "private-to-signed-in-user" ||
    page.track !== track ||
    page.context?.materialHash !== c.materialHash ||
    page.context?.nestedKey !== c.nestedKey ||
    page.context?.structureId !== c.structureId ||
    page.context?.sourceFrame !== c.sourceFrame ||
    page.context?.catalogScope !== c.catalogScope ||
    !Array.isArray(page.history) ||
    page.history.length > 20
  )
    throw Error(
      "The worksheet or history scope changed. Export your edits and reload.",
    );
  const history = page.history.map(parseSavedNestedReview);
  let previous = before;
  for (const r of history) {
    if (
      r.nestedKey !== c.nestedKey ||
      r.structureId !== c.structureId ||
      r.track !== track ||
      r.version >= previous
    )
      throw Error("Mismatched or unordered history.");
    previous = r.version;
  }
  const nextBefore = history.length === 20 ? history.at(-1)!.version : null;
  if (page.nextBefore !== nextBefore) throw Error("Invalid history cursor.");
  return { history, nextBefore };
}
export function nestedDraftFromSaved(
  r: SavedNestedReview | undefined,
  c: NestedReviewContext,
  track: NestedReviewTrack,
) {
  if (!r) return blankNestedReview(c, track);
  if (
    r.nestedKey !== c.nestedKey ||
    r.structureId !== c.structureId ||
    r.track !== track
  )
    throw Error("Wrong saved review scope.");
  return {
    ...blankNestedReview(c, track),
    reviewer: r.reviewer,
    qualification: r.qualification,
    scope: r.scope,
    notes: r.notes,
    evidence: structuredClone(r.evidence),
    issues: structuredClone(r.issues),
    checks: nestedReviewStale(r, c)
      ? blankNestedReview(c, track).checks
      : { ...r.checks },
    status: "draft" as const,
    attested: false,
  };
}
