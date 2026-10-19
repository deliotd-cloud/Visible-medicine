import {createHash} from 'node:crypto';
export const plexusHash=value=>createHash('sha256').update(value).digest('hex');
export function plexusFingerprints({study,topologyInputs,presentationInputs,assets,packages,checklistVersion,checklists}){
  const topologyHash=plexusHash(JSON.stringify({domain:'vm-original-plexus-topology-1',inputs:topologyInputs,study,checklistVersion,checklist:checklists.topology}));
  const presentationHash=plexusHash(JSON.stringify({domain:'vm-original-plexus-presentation-1',topologyHash,inputs:presentationInputs,assets,packages,checklistVersion,checklist:checklists.presentation}));
  const materialHash=plexusHash(JSON.stringify({domain:'vm-original-plexus-material-1',topologyHash,presentationHash}));
  return {topologyHash,presentationHash,materialHash};
}
