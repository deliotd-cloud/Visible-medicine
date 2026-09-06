/** Review evidence is independent of asset provenance. Never infer approval. */
export type ReviewEvidence = {
  status:
    | 'unreviewed'
    | 'draft'
    | 'not-loaded'
    | 'changes-required'
    | 'approved';
  reviewer: string | null;
  reviewedAt: string | null;
  evidenceUrls: string[];
  revisionHash: string | null;
  scope: string;
};
export type StructureReview = {
  structureId: string;
  geometry: ReviewEvidence;
  teaching: ReviewEvidence;
  imaging: ReviewEvidence;
};
export function getReviewStatus(
  structureId: string,
  teachingDraft = false,
): StructureReview {
  const empty = (
    status: ReviewEvidence['status'],
    scope: string,
  ): ReviewEvidence => ({
    status,
    scope,
    reviewer: null,
    reviewedAt: null,
    evidenceUrls: [],
    revisionHash: null,
  });
  return {
    structureId,
    geometry: empty('unreviewed', 'geometry and anatomical relationships'),
    teaching: empty(
      teachingDraft ? 'draft' : 'unreviewed',
      'structure-specific educational content',
    ),
    imaging: empty('not-loaded', 'licensed images and measured registration'),
  };
}
