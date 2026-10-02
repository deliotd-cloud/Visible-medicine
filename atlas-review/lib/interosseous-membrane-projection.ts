import pins from '../content/interosseous-membrane-projection-pins.json' with {type:'json'};
import {interosseousMembraneProjectionTopics,interosseousMembraneProjectionReferences,interosseousMembraneProjectionShared} from '../content/interosseous-membrane-projection';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),group:entry.group as 'forearm'|'leg'}]));

/** Eight draft placements over four complete source-pinned, sided root records. */
export function interosseousMembraneProjectionLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
 if(tab!=='ct'&&tab!=='xray')return undefined;
 const binding=bindings.get(s.id);
 if(!binding||binding.signature!==sourceCanonical(s))return undefined;
 const topic=interosseousMembraneProjectionTopics[binding.group][tab];
 return{readiness:'draft',title:`${s.name} · ${tab==='ct'?'CT':'X-ray'} orientation · draft`,body:topic.body,
  bullets:[...topic.bullets,...interosseousMembraneProjectionShared,
   'Return separation to zero before comparing anatomical relationships. Camera rotation and a separated model do not reproduce a patient acquisition plane.'],
  citations:topic.references.map(key=>interosseousMembraneProjectionReferences[key].url),
  note:'Independent anatomy/radiology review pending. No patient images, spatial registration, validated instability measurement or paid lecture content is connected. Confirm study, side, region and orientation for any future imaging link; this is reference teaching, not diagnosis, a scan protocol or treatment guidance.'};
}
