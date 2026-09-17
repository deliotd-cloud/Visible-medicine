import pins from '../content/elbow-clinical-pins.json' with {type:'json'};
import {elbowClinicalTopics as topics, elbowClinicalReferences as references, elbowClinicalCredit as credit} from '../content/elbow-clinical';
import {elbowArterialReference} from '../content/elbow-arterial';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family = keyof typeof topics;
const bound = new Map(pins.entries.map(entry => [entry.identity.id,
  {signature:sourceCanonical(entry.identity), family:entry.family as Family}]));

/** Exact bilateral root identities; no name-only or nested-source fallback. */
export function elbowClinicalLesson(s:BodyStructure, tab:ContentTab):ContentLesson|undefined {
  if (tab !== 'clinical' && tab !== 'pathology') return undefined;
  const match = bound.get(s.id);
  if (!match || sourceCanonical(s) !== match.signature) return undefined;
  const topic = topics[match.family][tab];
  return {
    readiness:'draft', title:`${s.name} · ${topic.title} · draft`, body:topic.body,
    bullets:[topic.prompt,
      'Source limit: finite reference surfaces do not establish continuous lumens, complete collateral networks or donor-specific junctions. Return separation to 0% for source-position comparison.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} source file${s.sources.length===1?'':'s'} in ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries and connections remain unvalidated.'}`,
      credit],
    citations:[...references, elbowArterialReference],
    note:'Source-bound educational draft for revision-bound radiologist review. No flow, collateral adequacy, tissue viability, injury diagnosis or CT/MRI/ultrasound registration is inferred from static surfaces. Not a diagnostic test or treatment algorithm. Atlas, case and paid-lecture access remain independent.',
  };
}
