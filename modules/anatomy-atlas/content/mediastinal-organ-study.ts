// Exact BodyParts3D v4 exterior source surfaces for a Thorax-only visibility
// comparison. These bindings do not establish internal anatomy or registration.
export const mediastinalOrganBindings = [
  {
    id: 'vm:anatomy:body:thorax:unpaired:organ:trachea',
    fmaId: 'FMA7394',
    laterality: 'unpaired',
    bundle: 'thorax-organs',
    nodeName: 'FMA7394',
    sources: [
      { file: 'FJ2541', sha256: 'f4c8cd3c70d212b09db6319e3b218b35aecfa02f53678d6886484a31aaa11cd9' },
    ],
  },
  {
    id: 'vm:anatomy:body:thorax:unpaired:organ:esophagus',
    fmaId: 'FMA7131',
    laterality: 'unpaired',
    bundle: 'thorax-organs',
    nodeName: 'FMA7131',
    sources: [
      { file: 'FJ2563', sha256: '0bc2935e13650b9a5ea143dee97767e2dba0589eae92f0df4e01f3e2fce3c4b0' },
    ],
  },
  {
    id: 'vm:anatomy:body:thorax:unpaired:organ:thymus',
    fmaId: 'FMA9607',
    laterality: 'unpaired',
    bundle: 'thorax-organs-recovery',
    nodeName: 'FMA9607',
    sources: [
      { file: 'FJ3150', sha256: '54102c62c92c793d69b6900b7b8b5d5a130ff024767e25a50eaac6105cb0189d' },
      { file: 'FJ3151', sha256: '12da29f923a948d45b2eee05bd39805ec84bea612aeaa7056f13813986415d67' },
    ],
  },
] as const;

export const mediastinalOrganStudy = {
  id: 'mediastinal-conduits-thymus',
  title: 'Mediastinal conduits & thymus',
  fmaIds: ['FMA7394', 'FMA7131', 'FMA9607'],
  view: 'anterior',
  description: 'Compare the supplied trachea, esophagus and thymus exterior reference surfaces in their shared source coordinates.',
  inspect: 'Rotate and select each surface; hide one to compare the others, then use Undo to restore it. These exterior reference surfaces do not establish a lumen, motility or swallowing, airway continuity, thymic microanatomy or involution, mediastinal distances, or patient registration. Source boundaries and relationships await revision-bound radiologist review.',
} as const;
