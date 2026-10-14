import before from '../content/lower-limb-connective-xray.before.json' with {type:'json'};
import {lowerLimbConnectiveXrayTeaching} from '../content/lower-limb-connective-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group = keyof typeof lowerLimbConnectiveXrayTeaching;
const bindings = new Map(before.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as Group,
}]));

/** Four exact sided root sources; no matching by name/FMA alone, scan or approval. */
export function lowerLimbConnectiveXrayLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const teaching = lowerLimbConnectiveXrayTeaching[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · X-ray orientation · draft`,
    body: teaching.body, bullets: [...teaching.bullets], citations: [...teaching.references],
    note: 'Revision-bound radiologist review pending. Return separation to zero before comparing anatomical relationships. Source attachment footprints and tissue continuity are unvalidated. No X-ray image, patient-space registration, validated projection or linked imaging study is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
