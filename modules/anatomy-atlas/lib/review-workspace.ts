import { structures } from '../app/anatomy-data';
import revisions from '../content/review-revisions.json';

export const tracks = ['geometry', 'teaching', 'imaging'] as const;
export type ReviewTrack = (typeof tracks)[number];
export type ReviewDecision = 'draft' | 'changes-required' | 'approved';
export type ReviewIssue = {
  id: string;
  title: string;
  severity: 'blocker' | 'major' | 'minor';
  resolved: boolean;
  resolution: string;
};
export type Evidence = { title: string; url: string; note: string };
export type ReviewDraft = {
  status: ReviewDecision;
  reviewer: string;
  qualification: string;
  scope: string;
  notes: string;
  checks: Record<string, boolean>;
  evidence: Evidence[];
  issues: ReviewIssue[];
  attested: boolean;
};
export type SavedReview = ReviewDraft & {
  structureId: string;
  track: ReviewTrack;
  version: number;
  savedAt: string;
  reviewedAt: string | null;
  revisionHash: string | null;
  checklistVersion: string;
};
export const checklistVersion = 'shoulder-review-1';
export const trackLabels: Record<ReviewTrack, string> = {
  geometry: 'Geometry',
  teaching: 'Teaching',
  imaging: 'Imaging',
};
export function checklist(structureId: string, track: ReviewTrack) {
  const s = structures.find((item) => item.id === structureId);
  if (!s) return [];
  const items =
    track === 'geometry'
      ? [
          [
            'identity',
            `Confirm ${s.name}: label, identity and right-sided orientation.`,
          ],
          [
            'shape',
            s.category === 'bone'
              ? 'Inspect shape, landmarks and articular surfaces.'
              : 'Inspect the muscle/tendon representation, boundaries and attachments.',
          ],
          [
            'relationships',
            'Check relationships to adjacent bones, muscles and visible soft tissues.',
          ],
          [
            'views',
            'Inspect anterior, posterior, lateral and deep illustration views.',
          ],
          [
            'dissection',
            'Check crop, labels, isolation, explode and exact reassembly.',
          ],
          [
            'omissions',
            'Document omitted structures, variants and limits of this source model.',
          ],
        ]
      : track === 'teaching'
        ? [
            [
              'anatomy',
              'Check Anatomy and Function, including named attachments and actions where relevant.',
            ],
            [
              'radiology-copy',
              'Check CT, MRI and Ultrasound teaching descriptions (not acquired images).',
            ],
            [
              'clinical',
              'Check Pathology and Clinical wording, scope and limitations.',
            ],
            [
              'quiz',
              'Check the quick question, answer choices and applicable identification-exam answers.',
            ],
            [
              'evidence',
              'Link authoritative evidence that supports the reviewed claims.',
            ],
            [
              'scope',
              'Record learner level, omissions and required corrections.',
            ],
          ]
        : [
            ['rights', 'Verify image reuse rights and de-identification.'],
            [
              'identity',
              'Confirm patient/reference scope, laterality and series identity.',
            ],
            [
              'registration',
              'Check spatial metadata, landmarks and measured registration error.',
            ],
            [
              'mapping',
              'Verify structure-to-image mapping in both directions.',
            ],
            [
              'interpretation',
              'Review image annotations and imaging teaching with a radiologist.',
            ],
          ];
  return items.map(([id, label]) => ({ id, label }));
}
export function currentRevision(id: string, track: ReviewTrack): string | null {
  const entry = revisions.revisions[id as keyof typeof revisions.revisions];
  return entry?.[track] ?? null;
}
export function blankReview(id: string, track: ReviewTrack): ReviewDraft {
  return {
    status: 'draft',
    reviewer: '',
    qualification: '',
    scope: '',
    notes: '',
    checks: Object.fromEntries(checklist(id, track).map((c) => [c.id, false])),
    evidence: [],
    issues: [],
    attested: false,
  };
}
export function staleReview(r: SavedReview) {
  return (
    r.revisionHash !== currentRevision(r.structureId, r.track) ||
    r.checklistVersion !== checklistVersion
  );
}
export function decisionLabel(r?: SavedReview) {
  if (!r) return 'Not started';
  if (staleReview(r)) return 'Re-review required';
  return r.status === 'approved'
    ? 'Approval recorded'
    : r.status === 'changes-required'
      ? 'Changes required'
      : 'In progress';
}
export function approvalProblems(
  draft: ReviewDraft,
  id: string,
  track: ReviewTrack,
) {
  const problems: string[] = [];
  if (!currentRevision(id, track))
    problems.push(
      'No acquired imaging is loaded. Imaging approval is unavailable.',
    );
  if (checklist(id, track).some((c) => draft.checks[c.id] !== true))
    problems.push('Complete every checklist item.');
  if (draft.issues.some((i) => !i.resolved))
    problems.push('Resolve all open issues.');
  if (!draft.reviewer.trim() || !draft.qualification.trim())
    problems.push(
      'Provide the reviewer name and professional role/qualification.',
    );
  if (draft.scope.trim().length < 10)
    problems.push('Describe the review scope (at least 10 characters).');
  if (!draft.evidence.length)
    problems.push('Add at least one supporting evidence link.');
  if (!draft.attested)
    problems.push('Confirm that you personally performed this review.');
  return problems;
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function string(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max)
    throw new Error('A text field is missing or too long.');
  return value.trim();
}
export function validateDraft(
  input: unknown,
  id: string,
  track: ReviewTrack,
): ReviewDraft {
  if (!record(input)) throw new Error('Invalid review payload.');
  if (!['draft', 'changes-required', 'approved'].includes(String(input.status)))
    throw new Error('Invalid review status.');
  const expected = checklist(id, track).map((c) => c.id);
  if (
    !record(input.checks) ||
    Object.keys(input.checks).length !== expected.length ||
    expected.some(
      (k) => typeof (input.checks as Record<string, unknown>)[k] !== 'boolean',
    )
  )
    throw new Error('Checklist does not match this structure and track.');
  if (
    !Array.isArray(input.evidence) ||
    input.evidence.length > 12 ||
    !Array.isArray(input.issues) ||
    input.issues.length > 20
  )
    throw new Error('Evidence or issue limit exceeded.');
  const evidence = input.evidence.map((item: unknown) => {
    if (!record(item)) throw new Error('Invalid evidence.');
    const title = string(item.title, 180),
      url = string(item.url, 2048),
      note = string(item.note, 1000);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Evidence must use an absolute HTTPS URL.');
    }
    if (
      !title ||
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password
    )
      throw new Error(
        'Evidence needs a title and a credential-free HTTPS URL.',
      );
    return { title, url: parsed.href, note };
  });
  const issues = input.issues.map((item: unknown) => {
    if (!record(item)) throw new Error('Invalid issue.');
    const id = string(item.id, 80),
      title = string(item.title, 500),
      resolution = string(item.resolution, 1500);
    if (
      !id ||
      !title ||
      !['blocker', 'major', 'minor'].includes(String(item.severity)) ||
      typeof item.resolved !== 'boolean'
    )
      throw new Error('Invalid issue fields.');
    if (item.resolved && resolution.length < 5)
      throw new Error('Resolved issues need an explanation.');
    return {
      id,
      title,
      resolution,
      resolved: item.resolved,
      severity: item.severity as ReviewIssue['severity'],
    };
  });
  if (new Set(issues.map((i) => i.id)).size !== issues.length)
    throw new Error('Duplicate issue IDs.');
  if (typeof input.attested !== 'boolean')
    throw new Error('Invalid attestation.');
  const draft: ReviewDraft = {
    status: input.status as ReviewDecision,
    reviewer: string(input.reviewer, 150),
    qualification: string(input.qualification, 200),
    scope: string(input.scope, 2000),
    notes: string(input.notes, 6000),
    checks: Object.fromEntries(
      expected.map((k) => [k, (input.checks as Record<string, boolean>)[k]]),
    ),
    evidence,
    issues,
    attested: input.attested,
  };
  if (draft.status === 'approved') {
    const problems = approvalProblems(draft, id, track);
    if (problems.length) throw new Error(problems.join(' '));
  }
  return draft;
}
