import pins from '../content/cerebellar-mca-imaging-pins.json' with { type: 'json' };
import { cerebellarMcaImagingTopics } from '../content/cerebellar-mca-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof cerebellarMcaImagingTopics;
const expectedGroups: Record<string, Group> = {
  FMA50519: 'pica',
  FMA50520: 'pica',
  FMA50574: 'sca',
  FMA50575: 'sca',
  FMA50082: 'mca',
};
const bindings = new Map(pins.entries.map(entry => [
  entry.identity.id,
  { signature: sourceCanonical(entry.identity), group: entry.group },
]));

export function cerebellarMcaImagingLesson(
  structure: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(structure.id);
  const group = expectedGroups[structure.fmaId];
  if (!binding || !group || binding.group !== group ||
      sourceCanonical(structure) !== binding.signature) return undefined;

  const topic = cerebellarMcaImagingTopics[group][tab];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: `Educational draft for revision-bound radiologist review. Compare assembled source positions at zero separation. The mesh is not an angiographic lumen and supplies no patient images, registration, flow, perfusion or clinical approval. Atlas, imaging-case and paid-lecture access remain independent. Source limit: ${structure.coverageNote}`,
  };
}
