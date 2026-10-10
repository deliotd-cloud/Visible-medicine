import pins from '../content/thoracoacromial-quiz-pins.json' with {type: 'json'};
import {pectoralBranchUltrasound} from '../content/pectoral-branch-ultrasound';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries
  .filter(entry => entry.group === 'pectoral' && ['FMA23063', 'FMA23064'].includes(entry.identity.fmaId))
  .map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Only the two retained source identities; never match by name or FMA alone. */
export function pectoralBranchUltrasoundLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || bindings.get(structure.id) !== sourceCanonical(structure)) return undefined;
  const lesson = pectoralBranchUltrasound;
  return {readiness: 'draft', title: `${structure.name} · Ultrasound · draft`,
    body: lesson.body, bullets: [...lesson.bullets], citations: [...lesson.citations], note: lesson.note};
}
