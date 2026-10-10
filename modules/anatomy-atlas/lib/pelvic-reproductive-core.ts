import pins from '../content/pelvic-reproductive-core-pins.json' with {type: 'json'};
import {
  pelvicReproductiveCoreGroups,
  pelvicReproductiveCoreReferences,
  pelvicReproductiveCoreTopics,
} from '../content/pelvic-reproductive-core';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group = keyof typeof pelvicReproductiveCoreTopics;
const bound = new Map(pins.entries.map((entry) => [
  entry.identity.id,
  {signature: sourceCanonical(entry.identity), group: entry.group as Group, laterality: entry.identity.laterality},
]));

/** Only the exact pinned adult-male root gains this draft; nested and foreign sources do not. */
export function pelvicReproductiveCoreLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'anatomy' && tab !== 'function') return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  if (s.system !== 'organs' || s.category !== 'organ' || s.region !== 'pelvis' ||
      !s.regions.includes('pelvis') || s.laterality !== match.laterality ||
      !(pelvicReproductiveCoreGroups[match.group] as readonly string[]).includes(s.fmaId)) return undefined;

  const topic = pelvicReproductiveCoreTopics[match.group];
  const section = topic[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${section.title} · draft`,
    body: section.body,
    bullets: [...section.bullets, `Visible source limit: ${topic.limit}${s.coverageNote ? ' ' + s.coverageNote : ''}`],
    citations: topic.references.map((key) => pelvicReproductiveCoreReferences[key]),
    note: 'Revision-bound radiologist review pending. Static reference surfaces do not establish microscopic anatomy, physiological activity, fertility, continence or patient findings. Atlas, case and paid-lecture access remain independent.',
  };
}
