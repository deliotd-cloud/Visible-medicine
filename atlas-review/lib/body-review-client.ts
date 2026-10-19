import {
  blankBodyReview,
  bodyDecisionScope,
  bodyReviewStale,
  bodyReviewTracks,
  parseSavedBodyReview,
  type BodyReviewContext,
  type BodyReviewDraft,
  type BodyReviewTrack,
  type SavedBodyReview,
} from './body-review-decisions';

export type BodyDecisionPage = {
  context: BodyReviewContext;
  reviews: SavedBodyReview[];
  history: SavedBodyReview[];
  track: BodyReviewTrack;
  nextBefore: number | null;
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const hash = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
/** Validate the fields consumed by the editor, including exact target/scope and historical keys. */
export function parseBodyDecisionPage(
  input: unknown,
  id: string,
  materialHash: string,
  track: BodyReviewTrack,
): BodyDecisionPage {
  if (
    !object(input) ||
    input.scope !== 'private-to-signed-in-user' ||
    input.track !== track ||
    !object(input.context)
  )
    throw new Error('Unexpected private review response.');
  const c = input.context;
  if (
    c.catalogScope !== bodyDecisionScope ||
    c.structureId !== id ||
    c.materialHash !== materialHash ||
    typeof c.structureName !== 'string' ||
    typeof c.checklistVersion !== 'string' ||
    !hash(c.sourceHash) ||
    !hash(c.teachingHash) ||
    !hash(c.rendererHash) ||
    !object(c.revisions) ||
    !object(c.blockers) ||
    !object(c.checklists) ||
    !Array.isArray(c.teachingTabs) ||
    !c.teachingTabs.every((t) => typeof t === 'string')
  )
    throw new Error(
      'The worksheet and current review material differ. Export your edits before reloading the page.',
    );
  for (const key of bodyReviewTracks) {
    const checks = c.checklists[key],
      blockers = c.blockers[key];
    if (
      (key === 'imaging'
        ? c.revisions[key] !== null
        : !hash(c.revisions[key])) ||
      !Array.isArray(checks) ||
      !checks.length ||
      checks.length > 30 ||
      checks.some(
        (v) =>
          !object(v) ||
          typeof v.id !== 'string' ||
          !v.id ||
          typeof v.label !== 'string',
      ) ||
      new Set(checks.map((v) => v.id)).size !== checks.length ||
      !Array.isArray(blockers) ||
      !blockers.every((v) => typeof v === 'string')
    )
      throw new Error('Invalid review context.');
  }
  if (
    !Array.isArray(input.reviews) ||
    input.reviews.length > 3 ||
    !Array.isArray(input.history) ||
    input.history.length > 20
  )
    throw new Error('Invalid saved review list.');
  const reviews = input.reviews.map(parseSavedBodyReview),
    history = input.history.map(parseSavedBodyReview);
  if (
    reviews.some((r) => r.structureId !== id) ||
    new Set(reviews.map((r) => r.track)).size !== reviews.length ||
    history.some(
      (r, index) =>
        r.structureId !== id ||
        r.track !== track ||
        (index > 0 && r.version >= history[index - 1].version),
    )
  )
    throw new Error('Mismatched review history.');
  if (
    input.nextBefore !== null &&
    (history.length !== 20 || input.nextBefore !== history.at(-1)?.version)
  )
    throw new Error('Invalid history cursor.');
  return {
    context: c as unknown as BodyReviewContext,
    reviews,
    history,
    track,
    nextBefore: input.nextBefore as number | null,
  };
}
export function bodyDraftsFromPage(
  page: BodyDecisionPage,
): Record<BodyReviewTrack, BodyReviewDraft> {
  return Object.fromEntries(
    bodyReviewTracks.map((track) => {
      const saved = page.reviews.find((r) => r.track === track),
        blank = blankBodyReview(page.context, track);
      return [
        track,
        saved
          ? {
              ...structuredClone(saved),
              status: 'draft',
              ...(bodyReviewStale(saved, page.context)
                ? { checks: blank.checks, attested: false }
                : {}),
            }
          : blank,
      ];
    }),
  ) as Record<BodyReviewTrack, BodyReviewDraft>;
}
/** Explicit reconciliation retains other-tab issues and invalidates previous checklist attestations. */
export function reconcileBodyDrafts(
  drafts: Record<BodyReviewTrack, BodyReviewDraft>,
  page: BodyDecisionPage,
) {
  const next = structuredClone(drafts);
  for (const track of bodyReviewTracks) {
    const latest = page.reviews.find((r) => r.track === track);
    next[track].issues.push(
      ...structuredClone(
        latest?.issues.filter(
          (i) => !next[track].issues.some((j) => j.id === i.id),
        ) ?? [],
      ),
    );
    next[track].checks = blankBodyReview(page.context, track).checks;
    next[track].attested = false;
    next[track].status = 'draft';
  }
  return next;
}
