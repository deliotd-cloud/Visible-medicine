import type {ContentTab} from '../app/anatomy-data';
import {legacyShoulderBoneReferences} from './legacy-shoulder-bone-references';
import {legacyShoulderMuscleReferences} from './legacy-shoulder-muscle-references';

// Identity- and topic-specific links, not a generic geometry credit or approval.
const references:Record<string,Partial<Record<ContentTab,readonly string[]>>>={...legacyShoulderBoneReferences,...legacyShoulderMuscleReferences};
export function legacyShoulderReferences(shortId:string,topic:ContentTab):string[]|undefined{
  if(topic==='xray'||!Object.hasOwn(references,shortId))return undefined;
  const row=references[shortId];
  if(!Object.hasOwn(row,topic))return undefined;
  const urls=row[topic];
  // Empty entries are explicit editorial evidence gaps, not invented references.
  return urls?.length?[...urls]:undefined;
}
