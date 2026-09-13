import { parseIndependentStudyLink } from '../../lib/independent-study-links';
import type { StudySearchParams } from '../../lib/study-links';
import type { RegionalModule } from './regions';

export function parseContainedSpecimen(params:StudySearchParams,region:RegionalModule|null) {
  if(!Object.keys(params).some(key=>key.startsWith('ref')))return {status:'none'} as const;
  const link=parseIndependentStudyLink(params);
  if(region!=='abdomen'||link.status!=='requested')return {status:'invalid'} as const;
  const kind=link.request.specimenKey==='bp3d3-abdominal-wall'?'abdominal-wall'
    :link.request.specimenKey==='hra-united-female-v1.10-kidneys'?'kidneys':null;
  return kind?{status:'ready',kind,link} as const:{status:'invalid'} as const;
}
