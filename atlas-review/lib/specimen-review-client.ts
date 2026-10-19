import {
  blankSpecimenReview,
  parseSavedSpecimenReview,
  specimenReviewStale,
  type SpecimenReviewContext,
  type SpecimenReviewTrack,
  type SavedSpecimenReview,
} from "./specimen-review";
export function parseSpecimenHistory(
  v: unknown,
  c: SpecimenReviewContext,
  track: SpecimenReviewTrack,
  before = 2147483648,
) {
  if (!v || typeof v !== "object") throw Error("Unexpected history response.");
  const page = v as {
    context?: SpecimenReviewContext;
    track?: string;
    scope?: string;
    history?: unknown[];
    nextBefore?: unknown;
  };
  if (
    page.scope !== "private-to-signed-in-user" ||
    page.track !== track ||
    page.context?.materialHash !== c.materialHash ||
    page.context?.specimenKey !== c.specimenKey ||
    page.context?.structureId !== c.structureId ||
    page.context?.sourceFrame !== c.sourceFrame ||
    page.context?.catalogScope !== c.catalogScope ||
    !Array.isArray(page.history) ||
    page.history.length > 20
  )
    throw Error(
      "The worksheet or history scope changed. Export your edits and reload.",
    );
  const history = page.history.map(parseSavedSpecimenReview);
  let previous = before;
  for (const r of history) {
    if (
      r.specimenKey !== c.specimenKey ||
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
export function specimenDraftFromSaved(
  r: SavedSpecimenReview | undefined,
  c: SpecimenReviewContext,
  track: SpecimenReviewTrack,
) {
  if (!r) return blankSpecimenReview(c, track);
  if (
    r.specimenKey !== c.specimenKey ||
    r.structureId !== c.structureId ||
    r.track !== track
  )
    throw Error("Wrong saved review scope.");
  return {
    ...blankSpecimenReview(c, track),
    reviewer: r.reviewer,
    qualification: r.qualification,
    scope: r.scope,
    notes: r.notes,
    evidence: structuredClone(r.evidence),
    issues: structuredClone(r.issues),
    checks: specimenReviewStale(r, c)
      ? blankSpecimenReview(c, track).checks
      : { ...r.checks },
    status: "draft" as const,
    attested: false,
  };
}
