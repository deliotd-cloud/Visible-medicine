import pins from '../content/spine-imaging-pins.json' with { type: 'json' };
import {
  spineImagingTopics,
  spineUltrasoundTopics,
  spineUltrasoundFmaIds,
  spineImagingReferences,
  type SpineImagingGroup,
  type SpineImagingModality,
} from '../content/spine-imaging-concepts';
import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(v);
const bound = new Map(
  pins.entries.map((p) => [
    p.identity.id,
    { signature: canonical(p.identity), group: p.group as SpineImagingGroup },
  ]),
);
const names = { ct: 'CT', mri: 'MRI', xray: 'X-ray', ultrasound: 'Ultrasound' };
const ultrasoundIds = new Set<string>(spineUltrasoundFmaIds);
const levelNotes: Record<string, string> = {
  FMA25058:
    'This source-labelled axis disc lies below C2; there is no C1–C2 intervertebral disc.',
  FMA12525:
    'C7–T1 is a transition: confirm junction coverage and patient numbering rather than relying on a prominent spinous process.',
  FMA9165:
    'This T1 selection belongs at the cervicothoracic transition; the source name is not an automatic patient-level label.',
  FMA10081:
    'The source T12–L1 disc is unresolved, not normally absent. The bones-only study must not imply collapse or fusion.',
  FMA13072:
    'The neighbouring T12–L1 disc is unresolved in this source, not normally absent or fused.',
  FMA13076:
    'At L5–S1, independently confirm vertebral numbering and any transitional anatomy on the actual examination.',
  FMA16202:
    'The whole sacrum is selected; S1 and individual foramina are not independently segmented or mapped to patient images.',
  FMA16037:
    'The source calls this the fifth-lumbar disc. Confirm patient lumbosacral numbering; no automatic level transfer is provided.',
};

/** Original modality teaching for exact source records. No FMA-only fallback,
 * patient registration or instruction to order a particular examination. */
export function spineImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!['ct', 'mri', 'xray', 'ultrasound'].includes(tab)) return undefined;
  const match = bound.get(s.id);
  if (!match || canonical(s) !== match.signature) return undefined;
  if (tab === 'ultrasound' && !ultrasoundIds.has(s.fmaId)) return undefined;
  const modality = tab as SpineImagingModality,
    value = modality === 'ultrasound'
      ? spineUltrasoundTopics[match.group]
      : spineImagingTopics[match.group][modality];
  return {
    readiness: 'draft',
    title: `${s.name} · ${names[modality]} orientation · draft`,
    body: value.body,
    bullets: [
      ...value.bullets,
      ...(modality === 'ultrasound' ? [
        'In adults, sound is limited by bone: a superficial contour is not a reliable view of vertebral interiors, canal contents or intervertebral discs. Non-visibility does not establish normality, absence or pathology.',
        'Neonatal and early-infant spinal canal sonography is a different, indication-dependent examination through incompletely ossified posterior elements; do not transfer that capability to adults.',
      ] : []),
      ...(levelNotes[s.fmaId] ? [levelNotes[s.fmaId]] : []),
      'Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements.',
    ],
    note: 'Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.',
    citations: [
      ...new Set(value.references.map((key) => spineImagingReferences[key])),
    ],
  };
}
