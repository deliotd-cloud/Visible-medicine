import pins from '../content/laryngeal-framework-quiz-pins.json' with {type:'json'};
import {laryngealInletImagingTopics, laryngealInletImagingScope, laryngealInletImagingNote} from '../content/laryngeal-inlet-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family = keyof typeof laryngealInletImagingTopics;
const allowed = new Set(['FMA55115','FMA55116','FMA55117','FMA55118']);
const bindings = new Map(pins.entries.filter(entry => allowed.has(entry.identity.fmaId)
  && Object.hasOwn(laryngealInletImagingTopics, entry.group)).map(entry => [entry.identity.id,
  {signature:sourceCanonical(entry.identity), family:entry.group as Family}]));

/** Four exact retained identities; no name, side or neighbouring-cartilage fallback. */
export function laryngealInletImagingLesson(structure:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const bound = bindings.get(structure.id);
  if (!bound || bound.signature !== sourceCanonical(structure)) return undefined;
  const topic = laryngealInletImagingTopics[bound.family][tab];
  return {readiness:'draft', title:`${structure.name} · ${tab.toUpperCase()} orientation · draft`,
    body:topic.body, bullets:[...topic.bullets, laryngealInletImagingScope],
    citations:[...topic.citations], note:laryngealInletImagingNote};
}
