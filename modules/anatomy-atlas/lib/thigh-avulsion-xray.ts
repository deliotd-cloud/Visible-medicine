import pins from '../content/hip-imaging-pins.json' with {type:'json'};
import {thighAvulsionXrayLimits,thighAvulsionXrayTeaching} from '../content/thigh-avulsion-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Kind = keyof typeof thighAvulsionXrayTeaching;
const selected = new Map<string,{id:string;side:'right'|'left';kind:Kind}>([
  ['FMA38928',{id:'vm:anatomy:body:thigh:right:muscle:right-rectus-femoris',side:'right',kind:'rectus'}],
  ['FMA38929',{id:'vm:anatomy:body:thigh:left:muscle:left-rectus-femoris',side:'left',kind:'rectus'}],
  ['FMA22322',{id:'vm:anatomy:body:thigh:right:muscle:right-iliacus',side:'right',kind:'iliacus'}],
  ['FMA22323',{id:'vm:anatomy:body:thigh:left:muscle:left-iliacus',side:'left',kind:'iliacus'}],
  ['FMA22448',{id:'vm:anatomy:body:thigh:right:muscle:right-semimembranosus',side:'right',kind:'semimembranosus'}],
  ['FMA22449',{id:'vm:anatomy:body:thigh:left:muscle:left-semimembranosus',side:'left',kind:'semimembranosus'}],
  ['FMA22358',{id:'vm:anatomy:body:thigh:right:muscle:right-semitendinosus',side:'right',kind:'semitendinosus'}],
  ['FMA22359',{id:'vm:anatomy:body:thigh:left:muscle:left-semitendinosus',side:'left',kind:'semitendinosus'}],
  ['FMA45888',{id:'vm:anatomy:body:thigh:right:muscle:long-head-of-right-biceps-femoris',side:'right',kind:'bicepsLong'}],
  ['FMA45889',{id:'vm:anatomy:body:thigh:left:muscle:long-head-of-left-biceps-femoris',side:'left',kind:'bicepsLong'}],
]);
const bindings = new Map(pins.entries.flatMap(({identity})=>{
  const expected=selected.get(identity.fmaId);
  return expected&&identity.id===expected.id
    ? [[identity.id,{signature:sourceCanonical(identity),side:expected.side,kind:expected.kind}] as const] : [];
}));

/** Exact retained source identities only; no names-only or patient-space matching. */
export function thighAvulsionXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const teaching=thighAvulsionXrayTeaching[binding.kind];
  return {
    readiness:'draft',title:`${s.name} · ${teaching.landmark} on X-ray · draft`,
    body:teaching.body,
    bullets:[`Orient the ${binding.side} reference structure at the ${teaching.landmark.toLowerCase()}. Verify the actual study's side marker and projection; the reference side is not a patient-side match.`,teaching.anatomy,teaching.limits,thighAvulsionXrayLimits.cohort,thighAvulsionXrayLimits.comparison],
    citations:[...teaching.citations],note:thighAvulsionXrayLimits.note,
  };
}
