import pins from '../content/lower-arterial-imaging-pins.json' with { type: 'json' };
import {
  lowerArterialImagingTopics,
  lowerArterialImagingReferences,
  lowerArterialImagingSelectionNotes,
  type LowerArterialImagingGroup,
  type LowerArterialModality,
} from '../content/lower-arterial-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
const bindings = new Map(
  pins.entries.map((e) => [
    e.identity.id,
    {
      signature: sourceCanonical(e.identity),
      group: e.group as LowerArterialImagingGroup,
    },
  ]),
);
const names = { ct: 'CT', mri: 'MRI', ultrasound: 'Ultrasound' };

/** A complete source-record match, not an ontology/name or patient-image mapping. */
export function lowerArterialImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!['ct', 'mri', 'ultrasound'].includes(tab)) return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic =
    lowerArterialImagingTopics[binding.group][tab as LowerArterialModality];
  const selection = lowerArterialImagingSelectionNotes.find((n) =>
    n.fmaIds.includes(s.fmaId),
  );
  if (!topic || !selection) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${names[tab as LowerArterialModality]} arterial orientation · draft`,
    body: topic.body,
    bullets: [
      selection.note,
      ...topic.bullets,
      'Return separation to zero before comparing anatomical relationships. Explode and cutaway do not generate scan slices, contrast enhancement or ultrasound findings.',
    ],
    note: 'Independent anatomy/radiology review pending. No patient images, scan registration or paid-lecture access. Confirm patient, side, region, orientation and the actual vascular acquisition. These notes are introductory teaching, not an examination protocol, diagnosis or procedural clearance.',
    citations: [
      ...new Set(
        [lowerArterialImagingReferences.anatomy, ...topic.references.map((key) => lowerArterialImagingReferences[key])],
      ),
    ],
  };
}
