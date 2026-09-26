import pins from '../content/lacrimal-drainage-imaging-pins.json' with { type: 'json' };
import { lacrimalDrainageGroups as groups, lacrimalDrainageReferences as references, type LacrimalDrainageModality } from '../content/lacrimal-drainage-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bound = new Map(pins.entries.map(e => [e.identity.id, { signature: sourceCanonical(e.identity), group: e.group, anatomy: e.anatomy }]));
const names = { ct: 'CT', mri: 'MRI' };
/** Exact original source only. No acquired study or examination is connected. */
export function lacrimalDrainageImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!Object.hasOwn(names, tab)) return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  const modality = tab as LacrimalDrainageModality;
  const focus = groups[match.group].focus[modality];
  return {
    readiness: 'draft',
    title: `${s.name} · ${names[modality]} orientation · draft`,
    body: focus.body,
    bullets: [match.anatomy.body, focus.pitfall, groups[match.group].limit],
    citations: [...new Set([...(match.anatomy.citations ?? []), ...focus.references.map(key => references[key])])],
    note: 'Anatomy/radiology review pending. Use reference positions with separation at zero. No imaging study or spatial registration is connected. Confirm patient, side, orientation and series in Didanix Education/light. Atlas, case and paid-lecture access remain independent; this source does not establish a channel, patient finding or procedure.',
  };
}
