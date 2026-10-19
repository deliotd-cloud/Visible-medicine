import pins from '../content/foot-venous-arch-xray-pins.json' with { type: 'json' };
import { footVenousArchXrayTopic, footVenousArchXrayNote } from '../content/foot-venous-arch-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = [
  {
    id: 'vm:anatomy:body:foot:right:vessel:dorsal-venous-arch-of-right-foot',
    fmaId: 'FMA44881', laterality: 'right', files: ['FJ2061', 'FJ2062'],
  },
  {
    id: 'vm:anatomy:body:foot:left:vessel:dorsal-venous-arch-of-left-foot',
    fmaId: 'FMA44882', laterality: 'left', files: ['FJ2059', 'FJ2060'],
  },
] as const;

if (pins.parentCommit !== 'f5052a1906bf9b87e5235bda57d367b1103729db' ||
    pins.sourceVersion !== '4.0' || pins.license !== 'CC-BY-4.0' ||
    pins.entries.length !== expected.length ||
    pins.entries.some((entry, index) => {
      const identity = entry.identity;
      const target = expected[index];
      return identity.id !== target.id || identity.fmaId !== target.fmaId ||
        identity.laterality !== target.laterality || identity.category !== 'vessel' ||
        identity.bundle !== 'foot-vessels-foot-vascular' ||
        sourceCanonical(identity.sources.map(source => source.file)) !== sourceCanonical(target.files) ||
        sourceCanonical(entry.topics) !== sourceCanonical(['xray']);
    })) throw Error('Unexpected foot venous arch X-ray source pins.');

const identities = new Map(pins.entries.map(entry => [
  entry.identity.id, sourceCanonical(entry.identity),
]));

/** Only the two exact BodyParts3D arch selections receive this editorial X-ray draft. */
export function footVenousArchXrayLesson(
  structure: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'xray' || identities.get(structure.id) !== sourceCanonical(structure))
    return undefined;
  return {
    readiness: 'draft',
    title: `${structure.name} · X-ray venous orientation · draft`,
    body: footVenousArchXrayTopic.body,
    bullets: [...footVenousArchXrayTopic.bullets],
    citations: [...footVenousArchXrayTopic.citations],
    note: footVenousArchXrayNote,
  };
}
