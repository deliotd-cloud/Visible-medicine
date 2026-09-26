// Source-coordinate exterior surfaces only. One left venous selection may contain
// several source files; those files do not represent individually named branches.
export const thoracicHilarReferences = [
  'https://anatomy.ttuhscep.edu/schemes/lungs_ans.html',
];

export const thoracicHilarBindings = [
  {
    id: 'vm:anatomy:body:thorax:right:organ:right-main-bronchus',
    fmaId: 'FMA7395', laterality: 'right', bundle: 'thorax-organs-inventory', nodeName: 'FMA7395',
    sources: [{ file: 'FJ2539', sha256: '0e1e4dc8c326263c21819c3c48a3e2e41e72fa92425983876d4902fa5dcc3074' }],
  },
  {
    id: 'vm:anatomy:body:thorax:right:vessel:right-pulmonary-artery',
    fmaId: 'FMA50872', laterality: 'right', bundle: 'thorax-vessels-recovery', nodeName: 'FMA50872',
    sources: [{ file: 'FJ3019', sha256: 'c773fc2d3d3f79544699c16f38f56619730a6d5a1a2c8bb4d8f0dc2ab6889d97' }],
  },
  {
    id: 'vm:anatomy:body:thorax:right:vessel:right-superior-pulmonary-vein',
    fmaId: 'FMA49914', laterality: 'right', bundle: 'thorax-vessels-recovery', nodeName: 'FMA49914',
    sources: [{ file: 'FJ3020', sha256: '074ba67bb3db8f93d6ac7d4e9d2bd1ddcca6e54a2bcb765ec146a9fd30bb3aa8' }],
  },
  {
    id: 'vm:anatomy:body:thorax:right:vessel:right-inferior-pulmonary-vein',
    fmaId: 'FMA49911', laterality: 'right', bundle: 'thorax-vessels-recovery', nodeName: 'FMA49911',
    sources: [{ file: 'FJ3040', sha256: '2e15b98f227f16c3dcacab1a93a26d42e07cd2c2d72ba34b1ef438396f598a12' }],
  },
  {
    id: 'vm:anatomy:body:thorax:left:organ:left-main-bronchus',
    fmaId: 'FMA7396', laterality: 'left', bundle: 'thorax-organs-inventory', nodeName: 'FMA7396',
    sources: [{ file: 'FJ2450', sha256: '7c4ac571448fb3d0c3c1095874bf17a60853bf12457d842a11dd2c62c0994946' }],
  },
  {
    id: 'vm:anatomy:body:thorax:left:vessel:left-pulmonary-artery',
    fmaId: 'FMA50873', laterality: 'left', bundle: 'thorax-vessels-recovery', nodeName: 'FMA50873',
    sources: [{ file: 'FJ2924', sha256: '0cb5312cf816387fdad0d3809a5b5cae1445806ce85546adea39240bc72d2580' }],
  },
  {
    id: 'vm:anatomy:body:thorax:left:vessel:left-superior-pulmonary-vein',
    fmaId: 'FMA49916', laterality: 'left', bundle: 'thorax-vessels-recovery', nodeName: 'FMA49916',
    sources: [
      { file: 'FJ2925', sha256: 'e87124704e4ca94bfe3206a571e464fe8ccc41afe0f36ee5ccf46cf00aaf4918' },
      { file: 'FJ2933', sha256: '64e0d2deec1d847be95f41a25c616935c9b400f233a2c07a8c453a3441f80a35' },
    ],
  },
  {
    id: 'vm:anatomy:body:thorax:left:vessel:left-inferior-pulmonary-vein',
    fmaId: 'FMA49913', laterality: 'left', bundle: 'thorax-vessels-recovery', nodeName: 'FMA49913',
    sources: [
      { file: 'FJ2944', sha256: 'a531b898f54ae008b1ad0c0f0993158e1a15cfbebee79098033ea8c2d2f84372' },
      { file: 'FJ2950', sha256: 'f32bbffccdb0528ed085041ad4243b5b4817a26aa82a73669f9132d6c54f17de' },
      { file: 'FJ2955', sha256: 'bfbb5067eb2da9857069139f12d019bb0f599babc89730aeb4accb1a77916991' },
    ],
  },
] as const;

const limits = ' These exterior source surfaces do not establish a joined lumen or ostia, a complete lobar map, surgical planes, or patient registration. The grouped left superior and inferior vein selections are not individually named branches. Source boundaries and relationships require revision-bound radiologist review.';

export const thoracicHilarStudies = [
  {
    id: 'right-pulmonary-hilum',
    title: 'Right pulmonary hilum: bronchus & vessels',
    fmaIds: ['FMA7395', 'FMA50872', 'FMA49914', 'FMA49911'],
    view: 'anterior',
    description: 'At the right lung root, compare the main bronchus with the right pulmonary artery and superior and inferior pulmonary vein exterior surfaces.',
    inspect: 'Rotate around the right bronchus to compare its posterior course with the artery and the more anterior and inferior venous surfaces. Select or remove one surface to see what it covers; Undo restores it. After separating surfaces, return to 0% before judging their source positions.' + limits,
  },
  {
    id: 'left-pulmonary-hilum',
    title: 'Left pulmonary hilum: bronchus & vessels',
    fmaIds: ['FMA7396', 'FMA50873', 'FMA49916', 'FMA49913'],
    view: 'anterior',
    description: 'At the left lung root, compare the main bronchus with the left pulmonary artery and grouped superior and inferior pulmonary vein exterior surfaces.',
    inspect: 'Rotate around the left bronchus and compare the superior arterial surface with the bronchus and the more anterior and inferior venous surfaces. Select or remove one surface to see what it covers; Undo restores it. After separating surfaces, return to 0% before judging their source positions.' + limits,
  },
] as const;
