import pins from '../content/hip-imaging-pins.json' with {type:'json'};
import {psoasXrayReferences,psoasXrayTeaching} from '../content/psoas-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const selected = new Map([
  ['FMA22342',{id:'vm:anatomy:body:spine:right:muscle:right-psoas-major',side:'right'}],
  ['FMA22343',{id:'vm:anatomy:body:spine:left:muscle:left-psoas-major',side:'left'}],
]);
const bindings = new Map(pins.entries.flatMap(({identity})=>{
  const expected=selected.get(identity.fmaId);
  return expected&&identity.id===expected.id?[[identity.id,{signature:sourceCanonical(identity),side:expected.side}] as const]:[];
}));

/** Exact retained whole-source identities only, never a patient-space overlay. */
export function psoasXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  return {
    readiness:'draft',title:`${s.name} · Psoas margin on X-ray · draft`,
    body:psoasXrayTeaching.body,
    bullets:[`Orient the ${binding.side} source muscle beside the lumbar spine. Check the real study's side marker and projection; a side label in this reference is not a patient-side match.`,psoasXrayTeaching.variability,psoasXrayTeaching.interpretation,psoasXrayTeaching.comparison],
    citations:[...psoasXrayReferences],
    note:'Anatomy/radiology review pending for this exact source and teaching revision. No imaging study loaded, patient registration or diagnostic decision is supplied. This is reference orientation teaching, not an acquisition or procedural protocol. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
