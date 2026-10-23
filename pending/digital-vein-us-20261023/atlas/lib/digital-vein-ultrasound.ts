import pins from '../content/hand-venous-imaging-pins.json' with {type:'json'};
import {digitalVeinUltrasoundTeaching as teaching} from '../content/digital-vein-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const selected = new Set(['FMA85096','FMA85097','FMA85098','FMA85099','FMA85100','FMA85101']);
const bindings = new Map(pins.entries.filter(entry =>
  entry.group === 'proper-digital-venous-detail' && selected.has(entry.identity.fmaId),
).map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Case comparison only, bound to the whole admitted record; never a visibility claim. */
export function digitalVeinUltrasoundLesson(structure:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'ultrasound' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  return {
    readiness:'draft', title:`${structure.name} · Ultrasound case comparison · draft`,
    body:teaching.body, bullets:[...teaching.bullets], citations:[...teaching.references], note:teaching.note,
  };
}
