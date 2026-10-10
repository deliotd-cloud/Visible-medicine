import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import {biliaryDuctXrayFacts,biliaryDuctXrayReferences} from '../content/biliary-duct-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.filter(e=>Object.hasOwn(biliaryDuctXrayFacts,e.identity.fmaId)).map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),entry:e}]));

/** Only exact retained source records; no imaging registration or clinical approval. */
export function biliaryDuctXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=biliaryDuctXrayFacts[binding.entry.identity.fmaId as keyof typeof biliaryDuctXrayFacts];
  const anatomy=binding.entry.anatomy;
  const limitation=anatomy.bullets?.find(b=>!b.startsWith('Source identity:'));
  return {
    readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:fact.body,
    bullets:[anatomy.body,fact.pitfall,...(limitation?[limitation]:[])],
    citations:[...new Set([...(anatomy.citations??[]),...biliaryDuctXrayReferences])],
    note:'Anatomy and radiology review pending. No acquired imaging study is included in this lesson. This is an unregistered model, not a cholangiogram or procedural guide. A separately available Education study requires its own access; no patient-space correspondence, patency or diagnosis is established here.',
  };
}
