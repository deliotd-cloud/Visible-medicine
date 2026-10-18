import {
  bodyApprovalProblems, bodyDecisionScope, bodyReviewTracks, isBodyReviewTrack,
  parseSavedBodyReview, validateBodyReviewDraft,
  type BodyReviewContext, type BodyReviewTrack, type SavedBodyReview,
} from '../atlas-review/lib/body-review-decisions.ts';
import {
  candidateDigest, canonicalCandidateJson, validateCandidate,
  type ClinicalReviewCandidate, type PersonalReviewCandidate,
} from './clinical-review-candidate.ts';

export type FrozenReviewContext = BodyReviewContext & {
  schema: 'vm-frozen-body-context-1';
  candidateId: string;
  worksheetHash: string;
  contextHash: string;
};
export type FrozenReviewEvent = {
  schema: 'vm-frozen-body-review-event-1';
  candidateId: string;
  contextHash: string;
  review: SavedBodyReview;
};
export type FrozenDecisionPage = {
  schema: 'vm-frozen-body-decision-page-1';
  scope: 'private-to-signed-in-account-and-institution';
  candidate: PersonalReviewCandidate;
  context: FrozenReviewContext;
  reviews: FrozenReviewEvent[];
  history: FrozenReviewEvent[];
  track: BodyReviewTrack;
  nextBefore: number | null;
};

const hex = /^[a-f0-9]{64}$/;
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const same = (a: unknown, b: unknown) => canonicalCandidateJson(a) === canonicalCandidateJson(b);
const timestamp = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

/** Rebuild exclusively from the immutable descriptor. No normal-build context is consulted. */
export async function frozenReviewContext(candidate: ClinicalReviewCandidate, id: string): Promise<FrozenReviewContext> {
  const trusted = await validateCandidate(candidate);
  if (trusted.decisionMode !== 'personal-review') throw new Error('Inspection-only candidates cannot record decisions.');
  const selection = trusted.selections.find(item => item.structureId === id);
  if (!selection) throw new Error('Selection is outside this frozen candidate.');
  const worksheet = trusted.files.find(file => file.path === 'worksheet.json');
  if (!worksheet) throw new Error('Frozen worksheet is missing.');
  const basis = selection.review;
  const checklists = structuredClone(basis.checklists);
  const blockers = structuredClone(basis.blockers);
  // No declared basis can make imaging approvable without a separately validated image package.
  const imagingBlocker = 'No validated acquired-image series or spatial registration is connected. Imaging approval is unavailable.';
  if (!blockers.imaging.includes(imagingBlocker)) blockers.imaging.push(imagingBlocker);
  const scope = { schema: 'vm-frozen-body-context-1' as const, catalogScope: bodyDecisionScope,
    candidateId: trusted.id, structureId: selection.structureId,
    checklistVersion: basis.checklistVersion, worksheetHash: worksheet.sha256 };
  const material = { materialHash: selection.materialHash, sourceHash: selection.sourceHash,
    teachingHash: selection.teachingHash, rendererHash: trusted.rendererRevision };
  const revisionMaterial = { ...scope, ...material, teachingTabs: basis.teachingTabs };
  const contextWithoutHash = {
    ...scope, structureName: selection.structureName, ...material, checklists, blockers,
    teachingTabs: [...basis.teachingTabs],
    revisions: {
      geometry: await candidateDigest({ ...revisionMaterial, track: 'geometry', checklist: checklists.geometry }),
      teaching: await candidateDigest({ ...revisionMaterial, track: 'teaching', checklist: checklists.teaching }),
      imaging: null,
    },
  };
  return { ...contextWithoutHash, contextHash: await candidateDigest(contextWithoutHash) };
}

/** Reject unexpected envelope and nested event material instead of silently dropping it. */
export function parseFrozenReviewEvent(value: unknown): FrozenReviewEvent {
  if (!object(value) || !exact(value, ['schema','candidateId','contextHash','review']) ||
    value.schema !== 'vm-frozen-body-review-event-1' || typeof value.candidateId !== 'string' ||
    !hex.test(value.candidateId) || typeof value.contextHash !== 'string' || !hex.test(value.contextHash))
    throw new Error('Invalid frozen review envelope.');
  const review = parseSavedBodyReview(value.review);
  if (!same(value.review, review)) throw new Error('Unexpected frozen review fields or normalization.');
  return { schema: 'vm-frozen-body-review-event-1', candidateId: value.candidateId,
    contextHash: value.contextHash, review };
}

/** Check every source-bound field, including approval rules, on read and before append. */
export function validateFrozenReviewEvent(
  input: FrozenReviewEvent, context: FrozenReviewContext, track?: BodyReviewTrack,
): FrozenReviewEvent {
  const event = parseFrozenReviewEvent(input), review = event.review;
  if (event.candidateId !== context.candidateId || event.contextHash !== context.contextHash ||
    review.catalogScope !== context.catalogScope || review.structureId !== context.structureId ||
    (track !== undefined && review.track !== track) ||
    review.revisionHash !== context.revisions[review.track] ||
    review.checklistVersion !== context.checklistVersion ||
    !same(review.checklist, context.checklists[review.track]) ||
    !same(review.material, { materialHash: context.materialHash, sourceHash: context.sourceHash,
      teachingHash: context.teachingHash, rendererHash: context.rendererHash,
      teachingTabs: context.teachingTabs }) ||
    !timestamp(review.savedAt) ||
    (review.reviewedAt !== null && (!timestamp(review.reviewedAt) || review.reviewedAt !== review.savedAt)) ||
    (review.status === 'approved' && bodyApprovalProblems(review, context, review.track).length > 0))
    throw new Error('Frozen review differs from its candidate context.');
  return event;
}

export function makeFrozenReviewEvent(
  draft: unknown, context: FrozenReviewContext, track: BodyReviewTrack, version: number, now: string,
): FrozenReviewEvent {
  if (!isBodyReviewTrack(track) || !Number.isSafeInteger(version) || version < 1 || version > 2147483647 || !timestamp(now))
    throw new Error('Invalid frozen review version or timestamp.');
  const clean = validateBodyReviewDraft(draft, context.checklists[track]);
  if (clean.status === 'approved') {
    const problems = bodyApprovalProblems(clean, context, track);
    if (problems.length) throw new Error(problems.join(' '));
  }
  const review: SavedBodyReview = { ...clean, eventSchema: 'vm-body-review-event-1',
    catalogScope: bodyDecisionScope, structureId: context.structureId, track, version,
    savedAt: now, reviewedAt: clean.status === 'approved' ? now : null,
    revisionHash: context.revisions[track], checklistVersion: context.checklistVersion,
    checklist: structuredClone(context.checklists[track]),
    material: { sourceHash: context.sourceHash, teachingHash: context.teachingHash,
      rendererHash: context.rendererHash, materialHash: context.materialHash,
      teachingTabs: [...context.teachingTabs] } };
  return validateFrozenReviewEvent({ schema: 'vm-frozen-body-review-event-1',
    candidateId: context.candidateId, contextHash: context.contextHash, review }, context, track);
}

export async function parseFrozenDecisionPage(
  value: unknown, expectedCandidateId: string, expectedStructureId: string,
): Promise<FrozenDecisionPage> {
  if (!object(value) || !exact(value, ['schema','scope','candidate','context','reviews','history','track','nextBefore']) ||
    value.schema !== 'vm-frozen-body-decision-page-1' ||
    value.scope !== 'private-to-signed-in-account-and-institution' ||
    !isBodyReviewTrack(value.track) || !Array.isArray(value.reviews) || value.reviews.length > bodyReviewTracks.length ||
    !Array.isArray(value.history) || value.history.length > 20)
    throw new Error('Invalid frozen decision page.');
  const candidate = await validateCandidate(value.candidate);
  if (candidate.decisionMode !== 'personal-review' || candidate.id !== expectedCandidateId)
    throw new Error('Frozen decision candidate mismatch.');
  const context = await frozenReviewContext(candidate, expectedStructureId);
  if (!same(value.context, context)) throw new Error('Frozen decision context mismatch.');
  const reviews = value.reviews.map(record => validateFrozenReviewEvent(record as FrozenReviewEvent, context));
  const history = value.history.map(record => validateFrozenReviewEvent(record as FrozenReviewEvent, context, value.track as BodyReviewTrack));
  if (new Set(reviews.map(record => record.review.track)).size !== reviews.length ||
    history.some((record, index) => index > 0 && record.review.version >= history[index - 1].review.version))
    throw new Error('Invalid frozen decision history.');
  const latestForTrack = reviews.find(record => record.review.track === value.track);
  if (history.length && (!latestForTrack || latestForTrack.review.version < history[0].review.version ||
    (latestForTrack.review.version === history[0].review.version && !same(latestForTrack, history[0]))))
    throw new Error('Frozen decision latest and history differ.');
  const nextBefore = history.length === 20 ? history[19].review.version : null;
  if (value.nextBefore !== nextBefore) throw new Error('Invalid frozen decision cursor.');
  return { schema: 'vm-frozen-body-decision-page-1',
    scope: 'private-to-signed-in-account-and-institution', candidate, context,
    reviews, history, track: value.track, nextBefore };
}
