/** Display hints for an already authorised Studio snapshot; the backend decides review authority. */
export type ReviewQueueContext = {
  actorId: string;
  organizationId: string;
  educationRoles: readonly string[];
};

type ReviewQueueRelease = {
  status: string;
  approvalCurrent?: boolean;
  id?: unknown;
  version?: unknown;
  materialRevision?: unknown;
  createdBy?: unknown;
  organizationId?: unknown;
};

const REVIEW_ROLES = ["instructor", "examiner", "administrator"] as const;

function isBoundId(value: unknown, maxLength = 120): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

function isEducationActor(value: unknown): value is string {
  return isBoundId(value,256) && value.startsWith("edu:") && value.length > 4 && value.slice(4).trim() === value.slice(4);
}

export function isPendingIndependentReview(release: Pick<ReviewQueueRelease, "status" | "approvalCurrent">): boolean {
  return release.status === "in-review" || (release.status === "approved" && release.approvalCurrent === false);
}

export function canOfferIndependentReview(release: ReviewQueueRelease, context: ReviewQueueContext): boolean {
  return isPendingIndependentReview(release)
    && isBoundId(release.id)
    && typeof release.version === "number" && Number.isSafeInteger(release.version) && release.version > 0
    && typeof release.materialRevision === "string" && /^[a-f0-9]{64}$/.test(release.materialRevision)
    && isEducationActor(context.actorId)
    && isBoundId(context.organizationId,256)
    && isEducationActor(release.createdBy)
    && isBoundId(release.organizationId,256)
    && release.organizationId === context.organizationId
    && release.createdBy !== context.actorId
    && Array.isArray(context.educationRoles)
    && context.educationRoles.some((role) => REVIEW_ROLES.some((allowed) => role === allowed));
}

export function partitionStudioReviewQueue<T extends ReviewQueueRelease>(releases: readonly T[], context: ReviewQueueContext): { independent: T[]; awaiting: T[] } {
  const independent: T[] = [];
  const awaiting: T[] = [];
  for (const release of releases) {
    if (!isPendingIndependentReview(release)) continue;
    (canOfferIndependentReview(release, context) ? independent : awaiting).push(release);
  }
  return { independent, awaiting };
}
