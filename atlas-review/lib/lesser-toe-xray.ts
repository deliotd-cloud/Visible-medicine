import pins from '../content/lesser-toe-xray-pins.json' with {type:'json'};
import {lesserToeXraySelections,lesserToeXrayTopics,lesserToeXrayReferences,lesserToeXrayScopeNote,type LesserToeSegment} from '../content/lesser-toe-xray';
import {acralBoneImagingGroups} from '../content/acral-bone-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),group:e.group as LesserToeSegment,imagingGroup:e.imagingGroup}]));

/** Only the exact individually named lesser-toe bone selections are admitted. */
export function lesserToeXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
 if(tab!=='xray')return undefined;
 const binding=bindings.get(s.id);if(!binding||sourceCanonical(s)!==binding.identity)return undefined;
 const spec=lesserToeXraySelections.find(item=>item.fmaId===s.fmaId),anatomy=acralBoneImagingGroups[binding.imagingGroup];
 if(!spec||spec.group!==binding.group||!anatomy?.fmaIds.includes(s.fmaId))return undefined;
 const topic=lesserToeXrayTopics[binding.group];
 return {readiness:'draft',title:`${s.name} · X-ray orientation · draft`,body:topic.body,
  bullets:[...topic.bullets,anatomy.landmark,anatomy.limitation],
  citations:[...new Set([...topic.references.map(key=>lesserToeXrayReferences[key]),...anatomy.anatomyReferences])],
  note:lesserToeXrayScopeNote};
}
