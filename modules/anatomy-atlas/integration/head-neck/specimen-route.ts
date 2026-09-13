import { parseIndependentStudyLink } from '../../lib/independent-study-links';
import type { StudySearchParams } from '../../lib/study-links';
import type { RegionalModule } from './regions';
import {parseSpecimenLink} from '../../lib/specimen-links';
import {containedIndependentSpecimens,containedLimbRegions} from '../../lib/model-delivery';

export function parseContainedSpecimen(params:StudySearchParams,region:RegionalModule|null) {
  if(Object.keys(params).some(key=>key.startsWith('specimen'))){
    if(!containedLimbRegions.some(value=>value===region)||Object.keys(params).some(key=>key.startsWith('ref')))return {status:'invalid'} as const;
    const link=parseSpecimenLink(params);
    return link.status==='requested'?{status:'ready',kind:'lower-limb',link} as const:{status:'invalid'} as const;
  }
  if(!Object.keys(params).some(key=>key.startsWith('ref')))return {status:'none'} as const;
  const link=parseIndependentStudyLink(params);
  if(link.status!=='requested')return {status:'invalid'} as const;
  const kind=Object.values(containedIndependentSpecimens).find(entry=>entry.region===region&&entry.key===link.request.specimenKey)?.kind;
  return kind?{status:'ready',kind,link} as const:{status:'invalid'} as const;
}
