// Exact source identities for the exterior proximal airway study. These are not
// lumen, carina, lobar-tree, or patient-registration evidence.
export const thoraxCentralAirwayBindings = [
  {
    id: 'vm:anatomy:body:thorax:unpaired:organ:trachea',
    fmaId: 'FMA7394', laterality: 'unpaired', bundle: 'thorax-organs', nodeName: 'FMA7394',
    sources: [{ file: 'FJ2541', sha256: 'f4c8cd3c70d212b09db6319e3b218b35aecfa02f53678d6886484a31aaa11cd9' }],
  },
  {
    id: 'vm:anatomy:body:thorax:right:organ:right-main-bronchus',
    fmaId: 'FMA7395', laterality: 'right', bundle: 'thorax-organs-inventory', nodeName: 'FMA7395',
    sources: [{ file: 'FJ2539', sha256: '0e1e4dc8c326263c21819c3c48a3e2e41e72fa92425983876d4902fa5dcc3074' }],
  },
  {
    id: 'vm:anatomy:body:thorax:left:organ:left-main-bronchus',
    fmaId: 'FMA7396', laterality: 'left', bundle: 'thorax-organs-inventory', nodeName: 'FMA7396',
    sources: [{ file: 'FJ2450', sha256: '7c4ac571448fb3d0c3c1095874bf17a60853bf12457d842a11dd2c62c0994946' }],
  },
] as const;

export const thoraxCentralAirwayStudy = {
  id: 'central-airways',
  title: 'Central airway source segments',
  fmaIds: ['FMA7394', 'FMA7395', 'FMA7396'],
  view: 'anterior',
  description: 'Compare the supplied trachea and proximal right and left main bronchus exterior surfaces.',
  inspect: 'Select and rotate each source segment. These surfaces do not establish a lumen, carina or lobar tree, continuity between segments, or patient registration. Source boundaries and relationships require revision-bound radiologist review.',
} as const;
