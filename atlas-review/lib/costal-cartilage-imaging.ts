import pins from '../content/costal-cartilage-imaging-pins.json' with {type:'json'};
import {costalCartilageImagingTopics} from '../content/costal-cartilage-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function costalCartilageImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ct'&&tab!=='mri'&&tab!=='ultrasound'&&tab!=='xray')return undefined;
 if(bindings.get(s.id)!==sourceCanonical(s))return undefined;
 const topic=costalCartilageImagingTopics[tab];
 return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
  bullets:[`Selection: ${s.name}. Confirm this side and numbered level on the patient study; cartilage is not the entire rib. Use zero separation to inspect the reference relationships.`,...topic.bullets,
   'Source limit: one recovered cartilage surface, not a complete chest wall, segmented joint, fracture or validated attachment footprint. Only the first through seventh paired costal-cartilage labels are included in this teaching batch.',
   `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,`Reference: ${topic.credit}`],citations:[...topic.citations],
  note:'Educational draft for revision-bound radiologist review, not a diagnostic test or procedure plan. No patient registration, scan or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.'};
}
