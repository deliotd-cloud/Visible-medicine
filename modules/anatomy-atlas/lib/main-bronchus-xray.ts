import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import {mainBronchusXrayFacts,mainBronchusXrayReferences} from '../content/main-bronchus-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.filter(e=>Object.hasOwn(mainBronchusXrayFacts,e.identity.fmaId)).map(e=>[e.identity.id,{signature:sourceCanonical(e.identity),entry:e}]));

/** Only these exact retained sources; neither patient imaging nor clinical approval. */
export function mainBronchusXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='xray')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.signature)return undefined;
  const fact=mainBronchusXrayFacts[binding.entry.identity.fmaId as keyof typeof mainBronchusXrayFacts];
  const anatomy=binding.entry.anatomy;
  const limitation=anatomy.bullets?.find(b=>!b.startsWith('Source identity:'));
  return {
    readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:fact.body,
    bullets:[anatomy.body,fact.pitfall,...(limitation?[limitation]:[])],
    citations:[...new Set([...(anatomy.citations??[]),...mainBronchusXrayReferences])],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No X-ray image, detector geometry or registered correspondence is loaded. Confirm side and projection in the separate Education viewer. This is not a diagnosis or a tube-positioning guide. Imaging-atlas and paid-lecture access remain independent.',
  };
}
