import pins from '../content/respiratory-core-depth-pins.json' with {type: 'json'};
import {
  respiratoryCoreDepthGroups,
  respiratoryCoreDepthReferences,
  respiratoryCoreDepthTopics,
} from '../content/respiratory-core-depth';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group = keyof typeof respiratoryCoreDepthTopics;
const bound = new Map(pins.entries.map((entry) => [
  entry.identity.id,
  {
    signature: sourceCanonical(entry.identity),
    group: entry.group as Group,
    laterality: entry.identity.laterality,
  },
]));

/** Exact current thoracic root only; source identity is not a clinical approval. */
export function respiratoryCoreDepthLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'anatomy' && tab !== 'function') return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  if (s.system !== 'organs' || s.category !== 'organ' || s.region !== 'thorax' ||
      !s.regions.includes('thorax') || s.laterality !== match.laterality ||
      !(respiratoryCoreDepthGroups[match.group] as readonly string[]).includes(s.fmaId)) return undefined;

  const topic = respiratoryCoreDepthTopics[match.group];
  if (tab === 'function' && !('function' in topic)) return undefined;
  const section = tab === 'anatomy' ? topic.anatomy : 'function' in topic ? topic.function : undefined;
  if (!section) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${section.title} · draft`,
    body: section.body,
    bullets: [...section.bullets, `Visible source limit: ${topic.limit}${s.coverageNote ? ' ' + s.coverageNote : ''}`],
    citations: topic.references.map((key) => respiratoryCoreDepthReferences[key]),
    note: 'Revision-bound radiologist review pending. Static reference surfaces do not establish internal layers, patent airways, physiological activity, patient findings or diagnostic measurements. Atlas, case and paid-lecture access remain independent.',
  };
}
