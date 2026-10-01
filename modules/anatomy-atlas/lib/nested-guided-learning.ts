import type {BodyCatalog,BodyStructure} from '../app/body-types';
import {eyeLayerGuide,type EyeLayerGuide} from './eye-layer-guide';
import {eyeDisplayCorrection} from './body-display-catalog';
import {nestedStudyTargets} from './nested-anatomy';
import bindings from '../content/nested-guided-learning-bindings.v1.json' with {type:'json'};

export type NestedGuidedStudyOption={
  id:string;title:string;region:'head-neck';kind:'eye';
  parent:BodyStructure;guide:EyeLayerGuide;sourceHash:string;parentHash:string;
};
const canonical=(v:unknown):string=>Array.isArray(v)?`[${v.map(canonical).join(',')}]`:
  v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canonical((v as Record<string,unknown>)[k])}`).join(',')}}`:JSON.stringify(v);

/** Discovery only: no resource access, clinical approval or registration grant.
 * Each side is admitted independently, without copying or repairing a catalogue. */
export function nestedGuidedStudyOptions(catalog:BodyCatalog,region='whole-body'):NestedGuidedStudyOption[]{
  if(!['whole-body','head-neck'].includes(region)||catalog?.sourceVersion!=='4.0'||
    canonical(catalog.coordinateSystem)!==canonical(eyeDisplayCorrection.coordinateSystem))return[];
  const targets=nestedStudyTargets(catalog);
  return catalog.structures.flatMap(parent=>{
    if(parent.region!=='head-neck'||!['right','left'].includes(parent.laterality)||
      catalog.structures.filter(s=>s.id===parent.id).length!==1)return[];
    const guide=eyeLayerGuide(parent);if(!guide)return[];
    const entries=targets.filter(t=>t.study==='eye'&&t.parentId===parent.id);
    const ids=new Set(guide.steps.flatMap(s=>s.ids));
    if(entries.length!==ids.size||entries.some(t=>!ids.has(t.structureId))||
      new Set(entries.map(t=>t.structureId)).size!==ids.size||
      new Set(entries.map(t=>t.sourceHash)).size!==1||new Set(entries.map(t=>t.parentHash)).size!==1)return[];
    const bundle=catalog.bundles.filter(b=>b.id===parent.bundle);
    const pinned=bindings.bindings.filter(b=>b.parentId===parent.id);
    if(bundle.length!==1||bundle[0].sha256!==entries[0].parentHash||pinned.length!==1||
      canonical(bundle[0])!==canonical(pinned[0].parentBundle))return[];
    return[{id:guide.id,title:`${parent.laterality==='right'?'Right':'Left'} eye layers`,region:'head-neck' as const,
      kind:'eye' as const,parent,guide,sourceHash:entries[0].sourceHash,parentHash:entries[0].parentHash}];
  }).sort((a,b)=>a.parent.laterality==='right'?-1:b.parent.laterality==='right'?1:0);
}
