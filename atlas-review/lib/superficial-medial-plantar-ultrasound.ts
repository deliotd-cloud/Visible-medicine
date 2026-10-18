import pins from '../content/superficial-medial-plantar-ultrasound-pins.json' with { type: 'json' };
import { superficialMedialPlantarUltrasoundTopic } from '../content/superficial-medial-plantar-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = new Map([
  ['FMA43937', 'vm:anatomy:body:foot:right:vessel:right-superficial-medial-plantar-artery'],
  ['FMA43938', 'vm:anatomy:body:foot:left:vessel:left-superficial-medial-plantar-artery'],
]);
if (pins.entries.length !== expected.size ||
  new Set(pins.entries.map(({ identity }) => identity.fmaId)).size !== expected.size ||
  pins.entries.some(({ identity }) =>
    expected.get(identity.fmaId) !== identity.id || identity.nodeName !== identity.fmaId))
  throw Error('Unexpected superficial medial plantar ultrasound pins.');

const bindings = new Map(pins.entries.map(({ identity }) => [identity.id, sourceCanonical(identity)]));

export function superficialMedialPlantarUltrasoundLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness: 'draft',
    title: `${structure.name} · Ultrasound orientation and limits · draft`,
    body: superficialMedialPlantarUltrasoundTopic.body,
    bullets: [...superficialMedialPlantarUltrasoundTopic.bullets],
    citations: [...superficialMedialPlantarUltrasoundTopic.citations],
    note: superficialMedialPlantarUltrasoundTopic.note,
  };
}
