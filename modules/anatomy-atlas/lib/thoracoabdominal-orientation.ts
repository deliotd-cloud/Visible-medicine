import pins from '../content/thoracoabdominal-orientation-pins.json' with { type: 'json' };
import { thoracoabdominalOrientationGroups, thoracoabdominalOrientationReferences } from '../content/thoracoabdominal-orientation';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group,
  topics: new Set(entry.topics),
}]));

/** Exact retained source identity and previously pending modality only. */
export function thoracoabdominalOrientationLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || binding.signature !== sourceCanonical(s) || !binding.topics.has(tab)) return undefined;
  const topic = thoracoabdominalOrientationGroups[binding.group]?.[tab];
  if (!topic) return undefined;
  const modality = tab === 'ct' ? 'CT' : 'MRI';
  const vessel = binding.group.includes('artery') || binding.group.includes('vein');
  const visibility = vessel
    ? binding.group.includes('vein')
      ? 'Routine MRI or arterial MRA cannot guarantee this small vein is seen or provide a complete venous drainage map; check actual venous-sensitive images.'
      : 'Routine MRI does not guarantee this small artery is seen; even dedicated MRA may have limited small-vessel detail.'
    : binding.group === 'mesoappendix'
      ? 'Neither CT nor MRI guarantees a separately visible mesoappendix; the named appendix and surrounding tissue are orientation landmarks only.'
      : 'MRI appearance depends on the acquired series and plane; this static source surface cannot supply tissue signal or patient measurements.';
  return {
    readiness: 'draft',
    title: `${s.name} · ${modality} orientation · draft`,
    body: topic.body,
    bullets: [topic.pitfall, visibility,
      'This unvalidated donor surface is not a patient scan, registered segmentation, verified branch/fascial map or diagnostic measurement.',
      'Return separation to zero before comparing anatomy; Atlas camera movement is not an acquisition plane.'],
    citations: [...new Set(topic.references.map(key => thoracoabdominalOrientationReferences[key]))],
    note: 'Didanix Education/light reference teaching only. Independent revision-bound radiologist review pending for this exact source and teaching scope. No patient images, spatial registration or approved imaging link is connected. Confirm the actual series, side and visible anatomy in the separate viewer. No diagnostic, acquisition, treatment or operative guidance. Case, Atlas and paid-lecture access remain independent.',
  };
}
