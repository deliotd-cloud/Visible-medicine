import pins from '../content/cervical-projection-xray-pins.json' with {type:'json'};
import {cervicalProjectionXrayFacts,cervicalProjectionXrayLimitations,cervicalProjectionXrayReferences} from '../content/cervical-projection-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof cervicalProjectionXrayFacts;
const expected:Readonly<Record<string,Family>>={FMA46309:'longusCapitis',FMA46310:'longusCapitis',FMA46313:'rectusAnterior',FMA46314:'rectusAnterior',FMA46317:'rectusLateralis',FMA46318:'rectusLateralis'};
const bindings=new Map(pins.entries.flatMap(entry=>expected[entry.identity.fmaId]===entry.family
  ?[[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}] as const]:[]));

/** A source-bound projection lesson, never an assertion of visible muscle boundaries. */
export function cervicalProjectionXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=cervicalProjectionXrayFacts[binding.family];
  return{readiness:'draft',title:`${s.name} · X-ray context · draft`,body:fact.body,
    bullets:[fact.distinction,fact.projection,...cervicalProjectionXrayLimitations],citations:[...cervicalProjectionXrayReferences],
    note:'Original educational draft; revision-bound radiologist review pending. No acquired image, clinical approval, diagnosis, validated muscle attachment or patient-space registration is supplied. Atlas, imaging-case and lecture access remain independent.'};
}
