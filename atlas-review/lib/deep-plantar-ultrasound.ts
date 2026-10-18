import pins from '../content/deep-plantar-ultrasound-pins.json' with { type: 'json' };
import { deepPlantarUltrasoundTopic } from '../content/deep-plantar-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = new Map([
  ['FMA69514', 'vm:anatomy:body:foot:right:vessel:right-deep-plantar-artery'],
  ['FMA69515', 'vm:anatomy:body:foot:left:vessel:left-deep-plantar-artery'],
]);
if (pins.entries.length !== expected.size ||
  new Set(pins.entries.map(({ identity }) => identity.fmaId)).size !== expected.size ||
  pins.entries.some(({ identity }) =>
  expected.get(identity.fmaId) !== identity.id || identity.nodeName !== identity.fmaId))
  throw Error('Unexpected deep plantar ultrasound pins.');

const bindings = new Map(pins.entries.map(({ identity }) => [identity.id, sourceCanonical(identity)]));

export function deepPlantarUltrasoundLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness: 'draft',
    title: `${structure.name} · Ultrasound evidence and limits · draft`,
    body: deepPlantarUltrasoundTopic.body,
    bullets: [...deepPlantarUltrasoundTopic.bullets],
    citations: [...deepPlantarUltrasoundTopic.citations],
    note: deepPlantarUltrasoundTopic.note,
  };
}
