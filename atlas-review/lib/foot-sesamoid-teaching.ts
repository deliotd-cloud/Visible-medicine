import pins from '../content/foot-sesamoid-teaching-pins.json' with {type:'json'};
import {footSesamoidLessons} from '../content/foot-sesamoid-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function footSesamoidLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 const signature=bindings.get(s.id),topic=footSesamoidLessons[tab];
 if(!signature||signature!==sourceCanonical(s)||!topic)return undefined;
 return {readiness:'draft',title:`${s.name} · ${tab==='xray'?'X-ray':tab==='ultrasound'?'Ultrasound':tab==='ct'||tab==='mri'?tab.toUpperCase():tab} · teaching draft`,
  body:topic.body,bullets:[...topic.bullets,'The source selection is a generic side-specific foot-sesamoid group, not a verified medial/tibial or lateral/fibular hallux component.'],citations:[...topic.citations],
  note:'Revision-bound anatomical and MSK radiology review pending. Restore assembled anatomy before comparing relationships. No acquired scans, registration or diagnostic measurements are supplied. Case, Atlas and paid-lecture access remain independent.'};
}
