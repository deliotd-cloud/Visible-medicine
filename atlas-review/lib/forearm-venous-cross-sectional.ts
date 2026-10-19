import pins from '../content/forearm-venous-cross-sectional-pins.json' with { type: 'json' };
import { forearmVenousCrossSectionalGroups as groups, forearmVenousCrossSectionalModes as modes,
  forearmVenousCrossSectionalReferences as references, type ForearmVenousCrossSectionalGroup as Group,
  type ForearmVenousCrossSectionalMode as Mode } from '../content/forearm-venous-cross-sectional';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  identity: sourceCanonical(entry.identity), group: entry.group as Group, topics: entry.topics as Mode[],
}]));
/** Exact archived source identity only; no patient image or entitlement binding. */
export function forearmVenousCrossSectionalLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || !binding.topics.includes(tab) || sourceCanonical(s) !== binding.identity) return undefined;
  const group = groups[binding.group], focus = group[tab];
  if (!focus) return undefined;
  const cited = new Set([...modes[tab].references, ...group.landmark.references, ...focus.references]);
  return {
    readiness: 'draft', title: `${s.name} · ${tab.toUpperCase()} venous orientation · draft`,
    body: modes[tab].text,
    bullets: [group.landmark.text, focus.text,
      'The selected source segment is an anatomy guide, not a complete superficial network. Colour does not establish vessel calibre, patency, exact confluence, or visibility in an acquired image.'],
    note: 'Original educational draft for revision-bound radiologist review. No image is loaded or registered to this source mesh; this is not scan acquisition advice or clinical approval. Atlas, imaging-case and paid-lecture access remain independent.',
    citations: [...cited].map(key => references[key]),
  };
}
