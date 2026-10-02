import pins from '../content/shoulder-girdle-imaging-pins.json' with { type: 'json' };
import { shoulderGirdleImagingGroups, shoulderGirdleImagingReferences } from '../content/shoulder-girdle-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, { signature: sourceCanonical(entry.identity), group: entry.group }]));

/** Draft orientation only for an exact retained donor selection. */
export function shoulderGirdleImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || binding.signature !== sourceCanonical(s)) return undefined;
  const topic = shoulderGirdleImagingGroups[binding.group];
  if (!topic) return undefined;
  const modality = tab === 'ct' ? 'CT' : 'MRI';
  const visibility = binding.group === 'suprascapular-vein'
    ? (tab === 'ct'
      ? 'Routine CT does not guarantee definition of this small vein. Confirm actual venous opacification; an arterial-phase CTA is not a complete venous drainage map.'
      : 'Routine MRI does not guarantee definition of this small vein. Confirm a venous-sensitive sequence and actual visible continuity; an arterial MRA is not a complete venous drainage map.')
    : (tab === 'ct'
      ? 'Routine CT does not guarantee definition of this small artery; vascular contrast timing and image quality affect visibility.'
      : 'Routine MRI does not guarantee definition of this small artery; even dedicated MRA can have limited small-vessel detail.');
  return {
    readiness: 'draft', title: `${s.name} · ${modality} orientation · draft`, body: topic.body,
    bullets: [topic.pitfall,
      visibility,
      'This retained donor surface is an anatomical orientation aid, not a patient scan, registered vessel, validated branch map or flow measurement.',
      'Return separation to zero before comparing relationships. Atlas camera movement is not a patient acquisition plane.'],
    citations: [...new Set(topic.references.map(key => shoulderGirdleImagingReferences[key]))],
    note: 'Independent revision-bound radiologist review pending. No patient images, spatial registration or approved imaging link is connected. Confirm actual series, side, vessel identity and visible course in the separate Didanix Education viewer. Reference teaching only, not diagnosis, acquisition protocol, management guidance or operative route. Case, Atlas and paid-lecture access remain independent.',
  };
}
