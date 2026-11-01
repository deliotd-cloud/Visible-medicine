import { PROSTATE_PARENT_ID, PROSTATE_PARENT_SOURCE, PROSTATE_ZONE_REVISION, prostateZones } from '../atlas-review/lib/prostate-zones';
import { prostateMriLessons, prostateMriReferences } from '../atlas-review/lib/prostate-mri-teaching';
import { prostateReviewModelHref } from './prostate-review-link';
import type { InboxDescriptor } from './clinical-review-inbox-contract';
import presentation from './prostate-review-presentation.json' with { type: 'json' };

const key = 'schematic:prostate-zones:inspection';
const scope = 'Original schematic · four regions · no patient-space registration';
const digest = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest(
  'SHA-256', new TextEncoder().encode(JSON.stringify(value)),
)), byte => byte.toString(16).padStart(2, '0')).join('');

/** One review packet reuses the actual learner copy and answer IDs. It grants no approval. */
export async function prostateReviewMaterial() {
  if (Object.keys(presentation).sort().join(',') !== 'presentationRevision,schema,sourceCommit' ||
      presentation.schema !== 'vm.prostate-review-presentation/1' ||
      typeof presentation.presentationRevision !== 'string' || typeof presentation.sourceCommit !== 'string' ||
      !/^[a-f0-9]{64}$/.test(presentation.presentationRevision) || !/^[a-f0-9]{40}$/.test(presentation.sourceCommit))
    throw Error('The prostate review presentation is not bound to a complete source revision.');
  const modelHref = prostateReviewModelHref(PROSTATE_ZONE_REVISION);
  if (!modelHref) throw Error('The prostate model revision is unavailable.');
  const zones = prostateZones.map(zone => {
    const lesson = prostateMriLessons[zone.key];
    if (!lesson || lesson.choices.filter(choice => choice.id === lesson.answerId).length !== 1 ||
        new Set(lesson.choices.map(choice => choice.id)).size !== lesson.choices.length ||
        !prostateMriReferences[lesson.reference] ||
        lesson.cautionReference && !prostateMriReferences[lesson.cautionReference])
      throw Error('The prostate teaching material is inconsistent.');
    return { ...zone, lesson };
  });
  if (zones.length !== 4 || new Set(zones.map(zone => zone.id)).size !== 4)
    throw Error('The prostate region set is incomplete or ambiguous.');
  const content = {
    schema: 'vm.prostate-review-material/1' as const,
    modelRevision: PROSTATE_ZONE_REVISION,
    presentationRevision: presentation.presentationRevision,
    sourceCommit: presentation.sourceCommit,
    representation: 'original-schematic' as const,
    coordinateFrame: 'vm:prostate:schematic:local-v1' as const,
    parent: { id: PROSTATE_PARENT_ID, ...PROSTATE_PARENT_SOURCE },
    zones, references: prostateMriReferences,
    checks: [
      'Inspect each region in the assembled, isolated, basal, mid-gland and apical views.',
      'Check relative shapes, boundaries, the schematic urethral channel and base-to-apex orientation.',
      'Confirm axial left/right labels and the distinction between a 3D cutaway and an MRI plane.',
      'Read all anatomy and MRI-recognition notes, questions, answer choices and explanations.',
    ],
    limitation: 'Original educational geometry, not an MRI segmentation or a patient-registered model. Sources support the referenced anatomy, not the accuracy of these authored shapes.',
    patientSpaceRegistration: null,
    clinicalApproval: false,
    decisionCapability: 'decision' as const,
  };
  return structuredClone({ ...content, revision: await digest(content), modelHref });
}

export async function prostateReviewInboxCatalog(): Promise<InboxDescriptor[]> {
  let revision: string | null = null;
  try { revision = (await prostateReviewMaterial()).revision; } catch { /* Explicitly unavailable. */ }
  return [{ key, title: 'Prostate zones · model and MRI teaching', area: 'structures', scopeLabel: scope,
    href: '/workspace/atlas-review/prostate' + (revision ? '?revision=' + revision : ''),
    trackLabel: 'Model and teaching decisions', revision, capability: 'decision' }];
}

export function prostateReviewPageSelection(params: Record<string, string | string[] | undefined>, revision: string) {
  if (Object.keys(params).some(name => name !== 'revision')) return 'invalid';
  const requested = params.revision;
  if (requested === undefined) return 'current';
  if (typeof requested !== 'string' || !/^[a-f0-9]{64}$/.test(requested)) return 'invalid';
  return requested === revision ? 'current' : 'stale';
}
