import { validateBodyReviewDraft, type BodyReviewDraft } from '../atlas-review/lib/body-review-decisions.ts';
import {
  plexusCandidateId, plexusChecklistVersion, plexusChecklists, plexusReviewScope, plexusReviewTracks,
  type PlexusReviewCheck, type PlexusReviewContext, type PlexusReviewTrack,
} from './plexus-review-contract.ts';

export type PlexusReviewDraft = BodyReviewDraft;
export type RecordedPlexusReviewContext = Omit<PlexusReviewContext,'sourceCommit'|'checklistVersion'|'checklists'> & {
  sourceCommit:string;
  checklistVersion:string;
  checklists:Record<PlexusReviewTrack,PlexusReviewCheck[]>;
};
export type SavedPlexusReview = PlexusReviewDraft & {
  eventSchema: 'vm-plexus-schematic-review-event-1';
  context: RecordedPlexusReviewContext;
  track: PlexusReviewTrack;
  version: number;
  savedAt: string;
  reviewedAt: string | null;
  revisionHash: string;
};

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const timestamp = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;
export const isPlexusReviewTrack = (v: unknown): v is PlexusReviewTrack => typeof v === 'string' && plexusReviewTracks.some(t => t === v);

export function validRecordedPlexusReviewContext(v: unknown): v is RecordedPlexusReviewContext {
  if (!object(v) || v.catalogScope !== plexusReviewScope || v.candidateId !== plexusCandidateId ||
    typeof v.candidateName !== 'string' || !v.candidateName.trim() || v.candidateName.length > 200 ||
    typeof v.sourceCommit !== 'string' || !/^[a-f0-9]{40}$/.test(v.sourceCommit) || !object(v.frame) ||
    v.frame.kind !== 'diagrammatic' || v.frame.units !== 'arbitrary' || v.frame.patientRegistration !== false ||
    v.partCount !== 35 || v.connectionCount !== 38 || v.clinicalApproved !== false ||
    v.learnerCatalogAdmission !== false || typeof v.checklistVersion !== 'string' ||
    !v.checklistVersion || v.checklistVersion.length > 80 ||
    !hash(v.materialHash) || !hash(v.topologyHash) || !hash(v.presentationHash) ||
    !object(v.revisions) || !object(v.checklists)) return false;
  for (const track of plexusReviewTracks) {
    const checklist = v.checklists[track];
    if (!hash(v.revisions[track]) || !Array.isArray(checklist) || !checklist.length || checklist.length > 30 ||
      checklist.some(c => !object(c) || typeof c.id !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(c.id) ||
        typeof c.label !== 'string' || !c.label.trim() || c.label.length > 1000) ||
      new Set(checklist.map(c => c.id)).size !== checklist.length ||
      !checklist.some(c => c.id === 'scope')) return false;
  }
  if (v.revisions.topology !== v.topologyHash || v.revisions.presentation !== v.presentationHash) return false;
  return true;
}

export function validPlexusReviewContext(v: unknown): v is PlexusReviewContext {
  return validRecordedPlexusReviewContext(v) &&
    v.checklistVersion === plexusChecklistVersion &&
    plexusReviewTracks.every(track => JSON.stringify(v.checklists[track]) === JSON.stringify(plexusChecklists[track]));
}

export function validatePlexusReviewContext(input: unknown): PlexusReviewContext {
  if (!validPlexusReviewContext(input)) throw new Error('Invalid schematic review context.');
  return input;
}

export function blankPlexusReview(context: PlexusReviewContext, track: PlexusReviewTrack): PlexusReviewDraft {
  return {status:'draft', reviewer:'', qualification:'', scope:'', notes:'',
    checks:Object.fromEntries(context.checklists[track].map(c => [c.id,false])), evidence:[], issues:[], attested:false};
}

export function plexusApprovalProblems(draft: PlexusReviewDraft, context: RecordedPlexusReviewContext, track: PlexusReviewTrack): string[] {
  const errors: string[] = [];
  if (!validRecordedPlexusReviewContext(context) || !isPlexusReviewTrack(track)) errors.push('Invalid schematic review scope.');
  else {
    if (context.checklists[track].some(c => draft.checks[c.id] !== true)) errors.push('Complete every checklist item.');
    if (draft.issues.some(i => !i.resolved)) errors.push('Resolve all open issues with explanations.');
    if (!draft.reviewer.trim() || !draft.qualification.trim()) errors.push('Provide reviewer name and professional role/qualification.');
    if (draft.scope.trim().length < 10) errors.push('Describe the schematic review scope (at least 10 characters).');
    if (!draft.evidence.length) errors.push('Add supporting HTTPS evidence.');
    if (!draft.attested) errors.push('Attest that you personally performed this review.');
  }
  return errors;
}

export function plexusReviewStale(saved: SavedPlexusReview, context: RecordedPlexusReviewContext): boolean {
  return !validRecordedPlexusReviewContext(context) || saved.context.catalogScope !== context.catalogScope ||
    saved.context.candidateId !== context.candidateId || saved.context.checklistVersion !== context.checklistVersion ||
    saved.revisionHash !== context.revisions[saved.track];
}

export function plexusDecisionLabel(saved: SavedPlexusReview | undefined, context: RecordedPlexusReviewContext): string {
  if (!saved) return 'Not started';
  if (plexusReviewStale(saved,context)) return 'Re-review required';
  return saved.status === 'approved'
    ? (saved.track === 'topology' ? 'Topology review recorded' : 'Presentation review recorded')
    : saved.status === 'changes-required' ? 'Changes required' : 'In progress';
}

export function parseSavedPlexusReview(input: unknown): SavedPlexusReview {
  if (!object(input) || input.eventSchema !== 'vm-plexus-schematic-review-event-1' ||
    !validRecordedPlexusReviewContext(input.context) || !isPlexusReviewTrack(input.track) ||
    !Number.isSafeInteger(input.version) || Number(input.version) < 1 || Number(input.version) > 2147483647 ||
    !timestamp(input.savedAt) || (input.reviewedAt !== null && !timestamp(input.reviewedAt)) ||
    !hash(input.revisionHash) || input.revisionHash !== input.context.revisions[input.track])
    throw new Error('Invalid stored schematic review.');
  const context = input.context, track = input.track;
  const draft = validateBodyReviewDraft(input, context.checklists[track]);
  if ((draft.status === 'approved' && (input.reviewedAt === null || plexusApprovalProblems(draft,context,track).length > 0)) ||
      (draft.status !== 'approved' && input.reviewedAt !== null) ||
      (input.reviewedAt !== null && input.reviewedAt !== input.savedAt))
    throw new Error('Invalid stored schematic decision.');
  return {...draft,eventSchema:'vm-plexus-schematic-review-event-1',context,track,
    version:Number(input.version),savedAt:input.savedAt,reviewedAt:input.reviewedAt as string|null,revisionHash:input.revisionHash};
}
