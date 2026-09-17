import pins from '../content/genicular-clinical-pins.json' with {type:'json'};
import {genicularClinicalTopics as topics,genicularClinicalReferences as references,genicularClinicalCredit as credit} from '../content/genicular-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
type Family=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}]));
export function genicularClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      'Source limit: original faces and disconnected parts remain unbridged. Named branches do not establish complete networks, continuous lumens, donor-specific junctions or measured supply territories.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} source file${s.sources.length===1?'':'s'} in ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      credit],
    citations:[...references],
    note:'Source-bound educational draft for revision-bound radiologist review. No flow, collateral adequacy, tissue viability, injury diagnosis or CT/MRI/ultrasound registration is inferred from static surfaces. Not an embolisation target, diagnostic test or treatment algorithm. Atlas, case and paid-lecture access remain independent.',
  };
}
