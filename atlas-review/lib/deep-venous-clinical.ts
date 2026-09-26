import pins from '../content/deep-venous-clinical-pins.json' with {type:'json'};
import {deepVenousClinicalTopics as topics,deepVenousClinicalReferences as references,deepVenousClinicalCredit as credit} from '../content/deep-venous-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}]));

/** Attach teaching only to the exact admitted source, never a name/FMA lookalike. */
export function deepVenousClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      match.family==='profunda'
        ? 'Source limit: this deep thigh surface does not supply validated collecting junctions, valves or lumen. Neighbouring femoral return remains a separate selection.'
        : 'Source limit: calf veins may have companion channels; this selection does not establish their full number. Anterior tibial selections contain two separate source parts. Fibular veins, exact collecting junctions, valves and lumen are not supplied.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'} in ${s.bundle}. ${s.coverageNote ?? 'Clinical tissue boundaries remain unvalidated.'}`,
      credit],
    citations:[...references],
    note:'Source-bound educational draft for revision-bound radiologist review. No flow, compression response, thrombosis, reflux or CT/MRI registration is inferred from these static surfaces. This is not a diagnostic test, scan protocol or treatment algorithm. Atlas, case and paid-lecture access remain independent.',
  };
}
