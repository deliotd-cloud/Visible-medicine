import {parseSpecimenLink,specimenLinkKeys} from '../atlas-review/lib/specimen-links';
import {limbDefinitions} from '../atlas-review/lib/um-limb-studies';
import {makeSpecimenLink,resolveSpecimenLink} from '../atlas-review/lib/um-limb-navigation';

/** Forwards only a current, exact UM specimen tuple. No ambient query is copied. */
export function lowerLimbStudySuffix(params:Record<string,string|string[]|undefined>):string|null{
  const parsed=parseSpecimenLink(params);
  if(parsed.status==='none')return '';
  if(parsed.status!=='requested'||resolveSpecimenLink(parsed).status!=='ready')return null;
  const request=parsed.request,definition=limbDefinitions[request.scope];
  if(!definition)return null;
  const canonical=makeSpecimenLink(definition,{selectedId:request.structureId,studyId:request.studyId,view:request.view,topic:request.topic});
  if(!canonical?.startsWith('/specimens/lower-limb?'))return null;
  const query=new URLSearchParams(canonical.slice(canonical.indexOf('?')+1));
  if(query.size<5||[...query.keys()].some(key=>!specimenLinkKeys.includes(key as typeof specimenLinkKeys[number])))return null;
  // Avoid forwarding an implicit replacement if the authored tuple changed.
  for(const key of specimenLinkKeys){
    const input=Object.hasOwn(params,key)?params[key]:undefined,output=query.get(key);
    if(input===undefined?output!==null:input!==output)return null;
  }
  return '?'+query.toString();
}
