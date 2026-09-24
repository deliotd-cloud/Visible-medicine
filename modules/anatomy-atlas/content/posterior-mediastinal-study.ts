// Exact BodyParts3D v4 exterior surfaces. Catalogue laterality is retained;
// these labels do not certify unilateral segmentation or spatial relationships.
export const posteriorMediastinalBindings = [
  {
    id: 'vm:anatomy:body:thorax:unpaired:organ:esophagus',
    fmaId: 'FMA7131', laterality: 'unpaired', bundle: 'thorax-organs', nodeName: 'FMA7131',
    sources: [{ file: 'FJ2563', sha256: '0bc2935e13650b9a5ea143dee97767e2dba0589eae92f0df4e01f3e2fce3c4b0' }],
  },
  {
    id: 'vm:anatomy:body:thorax:unspecified:vessel:descending-thoracic-aorta',
    fmaId: 'FMA87217', laterality: 'unspecified', bundle: 'thorax-vessels-recovery', nodeName: 'FMA87217',
    sources: [{ file: 'FJ1931', sha256: 'b213c8178b48f9afae695254f7bcfb3e08d5781878a76724c353e7e6ea6269be' }],
  },
  {
    id: 'vm:anatomy:body:thorax:unspecified:vessel:azygos-vein',
    fmaId: 'FMA4838', laterality: 'unspecified', bundle: 'thorax-vessels-recovery', nodeName: 'FMA4838',
    sources: [{ file: 'FJ3416', sha256: '88b374af13155c62ea5bcaad554a699d1d95e23948eeb810b62edb7467789dde' }],
  },
  {
    id: 'vm:anatomy:body:thorax:midline:vessel:hemiazygos-vein',
    fmaId: 'FMA4944', laterality: 'midline', bundle: 'thorax-vessels-recovery', nodeName: 'FMA4944',
    sources: [{ file: 'FJ3434', sha256: 'dcc2d6adb32cb84ffd91fd9104a3ba13986d6e9801231733086cbd8ab5ca2b26' }],
  },
] as const;

export const posteriorMediastinalStudy = {
  id: 'posterior-mediastinal-conduits',
  title: 'Posterior mediastinum: oesophagus & vessels',
  fmaIds: ['FMA7131', 'FMA87217', 'FMA4838', 'FMA4944'],
  view: 'posterior',
  description: 'Compare the supplied oesophagus, descending thoracic aorta, azygos and hemiazygos exterior surfaces in source coordinates. This selected group illustrates posterior mediastinal contents, not its complete boundaries.',
  inspect: 'From the posterior view, rotate and select each exterior surface, then remove one and use Undo to restore it. Compare the source display with the normal teaching pattern: azygos ascends on the right, hemiazygos crosses toward it, and the descending aorta approaches the midline inferiorly. These are reference relationships, not verified claims about this source geometry. Restore separation to 0% before judging source relationships. Both left and right side filters retain all four targets because their source labels are unpaired, unspecified or midline; those labels do not mean unilateral segmentation. No joined lumen or complete mediastinum is shown. Nerves, thoracic duct, lymph nodes and boundary planes are not drawn. These surfaces do not establish patient registration; source boundaries and relationships await revision-bound radiologist review.',
} as const;
