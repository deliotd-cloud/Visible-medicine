export const bodyDecisionScope = 'body-display-catalog' as const;
export const bodyChecklistVersion = 'body-review-1';
export const bodyReviewTracks = ['geometry', 'teaching', 'imaging'] as const;
export type BodyReviewTrack = (typeof bodyReviewTracks)[number];
export type BodyReviewDraft = {
  status: 'draft' | 'changes-required' | 'approved';
  reviewer: string;
  qualification: string;
  scope: string;
  notes: string;
  checks: Record<string, boolean>;
  evidence: { title: string; url: string; note: string }[];
  issues: {
    id: string;
    title: string;
    severity: 'blocker' | 'major' | 'minor';
    resolved: boolean;
    resolution: string;
  }[];
  attested: boolean;
};
export type BodyReviewCheck = { id: string; label: string };
export type BodyReviewContext = {
  catalogScope: typeof bodyDecisionScope;
  structureId: string;
  structureName: string;
  materialHash: string;
  sourceHash: string;
  teachingHash: string;
  rendererHash: string;
  checklistVersion: string;
  checklists: Record<BodyReviewTrack, BodyReviewCheck[]>;
  revisions: Record<BodyReviewTrack, string | null>;
  blockers: Record<BodyReviewTrack, string[]>;
  teachingTabs: string[];
};
export type SavedBodyReview = BodyReviewDraft & {
  eventSchema: 'vm-body-review-event-1';
  catalogScope: typeof bodyDecisionScope;
  structureId: string;
  track: BodyReviewTrack;
  version: number;
  savedAt: string;
  reviewedAt: string | null;
  revisionHash: string | null;
  checklistVersion: string;
  checklist: BodyReviewCheck[];
  material: {
    sourceHash: string;
    teachingHash: string;
    rendererHash: string;
    materialHash: string;
    teachingTabs: string[];
  };
};
export const bodyChecklists: Record<BodyReviewTrack, BodyReviewCheck[]> = {
  geometry: [
    {
      id: 'identity',
      label: 'Confirm source identity, laterality and grouped-part boundaries.',
    },
    {
      id: 'shape',
      label:
        'Inspect anatomical shape, surfaces, landmarks and attachments where represented.',
    },
    {
      id: 'relations',
      label:
        'Check local relationships, missing tissues, source defects and model limitations.',
    },
    {
      id: 'views',
      label:
        'Inspect labels and selection from anterior, posterior, lateral and rotated views.',
    },
    {
      id: 'dissection',
      label:
        'Check isolation, cutaway, separation, removal and exact reassembly on actual devices.',
    },
    {
      id: 'scope',
      label:
        'Record the specific educational scope reviewed; do not imply complete anatomy or operative safety.',
    },
  ],
  teaching: [
    {
      id: 'drafts',
      label:
        'Check every currently available draft topic and its supporting references.',
    },
    {
      id: 'clinical',
      label:
        'Verify anatomical/functional and clinical/pathology wording against the intended learner level.',
    },
    {
      id: 'modalities',
      label:
        'Review any available modality text separately from actual scan registration.',
    },
    {
      id: 'pending',
      label:
        'Identify pending/identity-only/generated topics; these are not covered as completed authored teaching.',
    },
    {
      id: 'assessment',
      label:
        'Check authored Quiz notes and the displayed source-specific interactive reasoning question where supplied, including its answer, alternatives, explanation and references. Other questions are excluded.',
    },
    {
      id: 'scope',
      label:
        'Document omissions, corrections and the precise scope of the available draft copy.',
    },
  ],
  imaging: [
    {
      id: 'rights',
      label: 'Verify acquired-image teaching rights and de-identification.',
    },
    {
      id: 'frame',
      label:
        'Confirm patient/reference identity, laterality, units, orientation and series/frame metadata.',
    },
    {
      id: 'registration',
      label: 'Validate registration landmarks, transform and measured error.',
    },
    {
      id: 'mapping',
      label:
        'Verify both-direction structure/image mapping and failure handling.',
    },
    {
      id: 'interpretation',
      label:
        'Review acquired-image annotations and interpretation with a radiologist.',
    },
  ],
};
export function blankBodyReview(
  context: BodyReviewContext,
  track: BodyReviewTrack,
): BodyReviewDraft {
  return {
    status: 'draft',
    reviewer: '',
    qualification: '',
    scope: '',
    notes: '',
    checks: Object.fromEntries(
      context.checklists[track].map((c) => [c.id, false]),
    ),
    evidence: [],
    issues: [],
    attested: false,
  };
}
export function bodyApprovalProblems(
  draft: BodyReviewDraft,
  context: BodyReviewContext,
  track: BodyReviewTrack,
) {
  const errors = [...context.blockers[track]];
  if (!context.revisions[track])
    errors.push('No approvable material revision is available for this track.');
  if (context.checklists[track].some((c) => draft.checks[c.id] !== true))
    errors.push('Complete every checklist item.');
  if (draft.issues.some((i) => !i.resolved))
    errors.push('Resolve all open issues with explanations.');
  if (!draft.reviewer.trim() || !draft.qualification.trim())
    errors.push('Provide reviewer name and professional role/qualification.');
  if (draft.scope.trim().length < 10)
    errors.push('Describe the review scope (at least 10 characters).');
  if (!draft.evidence.length) errors.push('Add supporting HTTPS evidence.');
  if (!draft.attested)
    errors.push('Attest that you personally performed this review.');
  return errors;
}
export function bodyReviewStale(
  review: SavedBodyReview,
  context: BodyReviewContext,
) {
  return (
    review.catalogScope !== context.catalogScope ||
    review.structureId !== context.structureId ||
    review.checklistVersion !== context.checklistVersion ||
    review.revisionHash !== context.revisions[review.track]
  );
}
export function bodyDecisionLabel(
  review: SavedBodyReview | undefined,
  context: BodyReviewContext,
) {
  if (!review) return 'Not started';
  if (bodyReviewStale(review, context)) return 'Re-review required';
  return review.status === 'approved'
    ? 'Approval recorded'
    : review.status === 'changes-required'
      ? 'Changes required'
      : 'In progress';
}
export const isBodyReviewTrack = (v: unknown): v is BodyReviewTrack =>
  typeof v === 'string' && bodyReviewTracks.some((t) => t === v);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number) => {
  if (typeof v !== 'string' || v.length > max)
    throw new Error('A text field is missing or too long.');
  return v.trim();
};
export function validateBodyReviewDraft(
  input: unknown,
  checklist: BodyReviewCheck[],
): BodyReviewDraft {
  if (
    !object(input) ||
    !['draft', 'changes-required', 'approved'].includes(String(input.status))
  )
    throw new Error('Invalid review status.');
  const checks = input.checks;
  if (
    !object(checks) ||
    Object.keys(checks).length !== checklist.length ||
    checklist.some((c) => typeof checks[c.id] !== 'boolean')
  )
    throw new Error('Checklist does not match this scope.');
  if (
    !Array.isArray(input.evidence) ||
    input.evidence.length > 12 ||
    !Array.isArray(input.issues) ||
    input.issues.length > 20
  )
    throw new Error('Evidence or issue limit exceeded.');
  const evidence = input.evidence.map((e) => {
    if (!object(e)) throw new Error('Invalid evidence.');
    const title = text(e.title, 180),
      note = text(e.note, 1000),
      url = new URL(text(e.url, 2048));
    if (!title || url.protocol !== 'https:' || url.username || url.password)
      throw new Error('Evidence needs a title and credential-free HTTPS URL.');
    return { title, note, url: url.href };
  });
  const issues = input.issues.map((i) => {
    if (!object(i)) throw new Error('Invalid issue.');
    const id = text(i.id, 80),
      title = text(i.title, 500),
      resolution = text(i.resolution, 1500);
    if (
      !id ||
      !title ||
      typeof i.resolved !== 'boolean' ||
      !['blocker', 'major', 'minor'].includes(String(i.severity)) ||
      (i.resolved && resolution.length < 5)
    )
      throw new Error(
        'Issues need valid fields and resolved issues need explanations.',
      );
    return {
      id,
      title,
      resolution,
      resolved: i.resolved,
      severity: i.severity as 'blocker' | 'major' | 'minor',
    };
  });
  if (
    new Set(issues.map((i) => i.id)).size !== issues.length ||
    typeof input.attested !== 'boolean'
  )
    throw new Error('Invalid issue IDs or attestation.');
  return {
    status: input.status as BodyReviewDraft['status'],
    reviewer: text(input.reviewer, 150),
    qualification: text(input.qualification, 200),
    scope: text(input.scope, 2000),
    notes: text(input.notes, 6000),
    checks: Object.fromEntries(
      checklist.map((c) => [c.id, checks[c.id] as boolean]),
    ),
    evidence,
    issues,
    attested: input.attested,
  };
}
/** Historical validation uses the recorded checklist, not today's approval rules. */
export function parseSavedBodyReview(input: unknown): SavedBodyReview {
  if (
    !object(input) ||
    input.eventSchema !== 'vm-body-review-event-1' ||
    input.catalogScope !== bodyDecisionScope ||
    !isBodyReviewTrack(input.track) ||
    typeof input.structureId !== 'string' ||
    !input.structureId ||
    input.structureId.length > 256 ||
    !Number.isSafeInteger(input.version) ||
    Number(input.version) < 1 ||
    Number(input.version) > 2147483647 ||
    !Array.isArray(input.checklist) ||
    input.checklist.length > 30 ||
    !object(input.material)
  )
    throw new Error('Invalid stored body review.');
  const checklist = input.checklist.map((c) => {
    if (!object(c)) throw new Error('Invalid stored checklist.');
    return { id: text(c.id, 80), label: text(c.label, 1000) };
  });
  if (
    !checklist.length ||
    checklist.some((c) => !c.id || !c.label) ||
    new Set(checklist.map((c) => c.id)).size !== checklist.length
  )
    throw new Error('Invalid stored checklist keys.');
  const hash = (h: unknown) => {
    if (typeof h !== 'string' || !/^[a-f0-9]{64}$/.test(h))
      throw new Error('Invalid stored material hash.');
    return h;
  };
  const timestamp = (v: unknown) => {
    const s = text(v, 40);
    if (!/^\d{4}-\d\d-\d\dT/.test(s) || !Number.isFinite(Date.parse(s)))
      throw new Error('Invalid stored timestamp.');
    return s;
  };
  const draft = validateBodyReviewDraft(input, checklist);
  const material = input.material;
  if (
    !Array.isArray(material.teachingTabs) ||
    material.teachingTabs.length > 9 ||
    !material.teachingTabs.every((t) => typeof t === 'string' && t.length < 30)
  )
    throw new Error('Invalid teaching scope.');
  if (
    draft.status === 'approved' &&
    (input.reviewedAt === null ||
      !draft.attested ||
      input.revisionHash === null ||
      input.track === 'imaging' ||
      !draft.reviewer ||
      !draft.qualification ||
      draft.scope.length < 10 ||
      !draft.evidence.length ||
      draft.issues.some((i) => !i.resolved) ||
      checklist.some((c) => !draft.checks[c.id]))
  )
    throw new Error('Invalid stored approval.');
  if (draft.status !== 'approved' && input.reviewedAt !== null)
    throw new Error('Non-approval has a review date.');
  return {
    ...draft,
    eventSchema: 'vm-body-review-event-1',
    catalogScope: bodyDecisionScope,
    structureId: input.structureId,
    track: input.track,
    version: Number(input.version),
    savedAt: timestamp(input.savedAt),
    reviewedAt: input.reviewedAt === null ? null : timestamp(input.reviewedAt),
    revisionHash: input.revisionHash === null ? null : hash(input.revisionHash),
    checklistVersion: text(input.checklistVersion, 80),
    checklist,
    material: {
      sourceHash: hash(material.sourceHash),
      teachingHash: hash(material.teachingHash),
      rendererHash: hash(material.rendererHash),
      materialHash: hash(material.materialHash),
      teachingTabs: material.teachingTabs,
    },
  };
}
