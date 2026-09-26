import source from '../public/models/bodyparts3d/anterior-cardiac-vein/catalog.json' with {type:'json'};
import {anteriorCardiacPathologyTopic as topic} from '../content/anterior-cardiac-pathology';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const id = 'vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein';
const bindings = new Map(source.structures
  .filter(s => s.id === id && s.fmaId === 'FMA76767')
  .map(s => [s.id, sourceCanonical(s)]));

export function anteriorCardiacPathologyLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if(tab !== 'pathology' || bindings.get(s.id) !== sourceCanonical(s)) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${topic.title} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, `Source limit: ${s.coverageNote}`, `Reference: ${topic.credit}`],
    citations: [...topic.citations],
    note: 'Educational draft pending revision-bound radiologist sign-off. No diseased geometry, diagnostic test, management recommendation or patient registration is established. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
