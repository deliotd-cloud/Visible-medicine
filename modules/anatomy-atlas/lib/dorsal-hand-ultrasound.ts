import pins from '../content/hand-venous-imaging-pins.json' with {type:'json'};
import {dorsalHandUltrasoundTeaching as teaching} from '../content/dorsal-hand-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const allowed = new Set(['FMA62506', 'FMA62507']);
const bindings = new Map(pins.entries.filter(entry =>
  entry.group === 'dorsal-hand-venous-detail' && allowed.has(entry.identity.fmaId),
).map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Two exact admitted dorsal networks, never a name/group/laterality fallback. */
export function dorsalHandUltrasoundLesson(structure:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'ultrasound' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness:'draft', title:`${structure.name} · Ultrasound orientation · draft`,
    body:teaching.body, bullets:[...teaching.bullets], citations:[...teaching.references], note:teaching.note,
  };
}
