import pins from '../content/dental-mri-pins.json' with {type:'json'};
import {dentalMriGroups,dentalMriTopics,dentalMriNote} from '../content/dental-mri';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Group=keyof typeof dentalMriGroups;
const bindings=new Map<string,{signature:string;group:Group}>();
const fmas=Object.values(dentalMriGroups).flat();
if(fmas.length!==28||new Set(fmas).size!==28||pins.entries.length!==28)
  throw Error('Unexpected dental MRI source scope');
for(const [group,ids] of Object.entries(dentalMriGroups)){
  if(!Object.hasOwn(dentalMriTopics,group))throw Error('Dental MRI group unavailable');
  for(const fma of ids){
    const matches=pins.entries.filter(entry=>entry.group===group&&entry.identity.fmaId===fma);
    if(matches.length!==1)throw Error('Dental MRI source identity unavailable');
    const identity=matches[0].identity;
    if(bindings.has(identity.id))throw Error('Duplicate dental MRI identity');
    bindings.set(identity.id,{signature:sourceCanonical(identity),group:group as Group});
  }
}

/** Shared method orientation on 28 exact exterior source records, not MRI data.
 * No FMA/name/laterality fallback or clinical/registration approval. */
export function dentalMriLesson(structure:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='mri')return undefined;
  const binding=bindings.get(structure.id);
  if(!binding||sourceCanonical(structure)!==binding.signature)return undefined;
  const topic=dentalMriTopics[binding.group];
  return {readiness:'draft',title:`${structure.name} · MRI methods orientation · draft`,
    body:topic.body,bullets:[...topic.bullets],citations:[...topic.citations],note:dentalMriNote};
}
