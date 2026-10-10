import pins from '../content/laryngeal-support-imaging-pins.json' with { type: 'json' };
import { laryngealSupportImagingGroups as groups, laryngealSupportImagingModes as modes,
  laryngealSupportImagingReferences as references, type LaryngealSupportImagingGroup as Group,
  type LaryngealSupportImagingMode as Mode } from '../content/laryngeal-support-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  identity: sourceCanonical(entry.identity), group: entry.group as Group, topics: entry.topics as Mode[],
}]));
/** Exact archived source identity only; no patient image or entitlement binding. */
export function laryngealSupportImagingLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || !binding.topics.includes(tab) || sourceCanonical(s) !== binding.identity) return undefined;
  const group = groups[binding.group], focus = group[tab];
  if (!focus) return undefined;
  const cited = new Set([...modes[tab].references, ...group.landmark.references, ...focus.references]);
  return {
    readiness: 'draft', title: `${s.name} · ${tab.toUpperCase()} laryngeal orientation · draft`,
    body: modes[tab].text,
    bullets: [group.landmark.text, focus.text,
      'This retained surface is a schematic anatomical reference. It does not prove patient-specific thickness, intact fibres, motion, disease, or image visibility. These neck notes do not imply coverage in the approved head scans.'],
    note: 'Original educational draft for revision-bound radiologist review. No image is loaded or registered to this source mesh; this is not scan acquisition advice or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.',
    citations: [...cited].map(key => references[key]),
  };
}
