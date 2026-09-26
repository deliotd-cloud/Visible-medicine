import pins from '../content/pelvic-organ-imaging-pins.json' with { type: 'json' };
import {
  pelvicOrganImagingTopics,
  pelvicOrganLandmarks,
  pelvicOrganLimits,
  pelvicOrganReferences,
  pelvicOrganLandmarkReferences,
  type PelvicOrganGroup,
  type PelvicOrganModality,
} from '../content/pelvic-organ-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(
  pins.entries.map((e) => [
    e.identity.id,
    {
      signature: sourceCanonical(e.identity),
      group: e.group as PelvicOrganGroup,
    },
  ]),
);
const names = { ct: 'CT', mri: 'MRI', ultrasound: 'Ultrasound', xray: 'X-ray' };
/** Exact source identity only; never transfers male-donor teaching to another specimen or scan. */
export function pelvicOrganImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!['ct', 'mri', 'ultrasound', 'xray'].includes(tab)) return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  const modality = tab as PelvicOrganModality,
    topic = pelvicOrganImagingTopics[match.group][modality];
  return {
    readiness: 'draft',
    title: `${s.name} · ${names[modality]} orientation · draft`,
    body: topic.body,
    bullets: [
      pelvicOrganLandmarks[match.group],
      ...topic.bullets,
      pelvicOrganLimits[match.group],
    ],
    citations: [
      ...new Set([
        pelvicOrganReferences[pelvicOrganLandmarkReferences[match.group]],
        ...topic.references.map((k) => pelvicOrganReferences[k]),
      ]),
    ],
    note: 'Anatomy/radiology review pending. Compare reference positions with separation at zero. No patient images, scan registration or paid-lecture access. Confirm organ, side, patient anatomy, sequence and contrast technique before future image comparison. This is orientation teaching, not a diagnosis, acquisition protocol or treatment recommendation.',
  };
}
