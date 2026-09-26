import pins from '../content/metatarsal-surface-imaging-pins.json' with {type:'json'};
import {metatarsalSurfaceSelections,metatarsalSurfaceTopics,metatarsalSurfaceReferences,metatarsalSurfaceScopeNote,type MetatarsalSurfaceGroup,type MetatarsalSurfaceTopic} from '../content/metatarsal-surface-imaging';
import {acralBoneImagingGroups} from '../content/acral-bone-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings=new Map(pins.entries.map(entry=>[entry.identity.id,{identity:sourceCanonical(entry.identity),group:entry.group as MetatarsalSurfaceGroup,imagingGroup:entry.imagingGroup,topics:new Set(entry.topics)}]));
const names={xray:'X-ray',ultrasound:'Ultrasound'};

/** Exact whole-bone source identities only; not an imaging or fracture-zone segmentation. */
export function metatarsalSurfaceImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(!Object.hasOwn(names,tab))return undefined;
  const binding=bindings.get(s.id);
  if(!binding||sourceCanonical(s)!==binding.identity||!binding.topics.has(tab))return undefined;
  const modality=tab as MetatarsalSurfaceTopic;
  const spec=metatarsalSurfaceSelections.find(item=>item.fmaId===s.fmaId);
  const anatomy=acralBoneImagingGroups[binding.imagingGroup];
  if(!spec||spec.group!==binding.group||!spec.topics.includes(modality)||!anatomy?.fmaIds.includes(s.fmaId))return undefined;
  const topic=metatarsalSurfaceTopics[binding.group][modality];
  return {
    readiness:'draft',title:`${s.name} · ${names[modality]} orientation · draft`,body:topic.body,
    bullets:[...topic.bullets,anatomy.landmark,anatomy.limitation],
    citations:[...new Set([...topic.references.map(key=>metatarsalSurfaceReferences[key]),...anatomy.anatomyReferences])],
    note:metatarsalSurfaceScopeNote,
  };
}
