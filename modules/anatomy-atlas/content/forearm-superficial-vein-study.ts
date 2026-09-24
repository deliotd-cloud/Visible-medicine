import type { AxialStudy } from '../lib/axial-anatomy';

// These are eight separately supplied surfaces, not a reconstructed route.
export const forearmSuperficialVeinStudy: AxialStudy = {
  id: 'forearm-superficial-veins',
  title: 'Superficial forearm veins',
  regions: ['forearm'],
  targetFmaIds: [
    'FMA13325', 'FMA13326', // cephalic
    'FMA22909', 'FMA22910', // basilic
    'FMA22964', 'FMA22965', // median cubital
    'FMA22968', 'FMA22969', // median antebrachial
  ],
  context: [{ fmaIds: ['FMA23464', 'FMA23465', 'FMA23467', 'FMA23468'] }],
  view: 'anterior',
  description:
    'Compare the supplied cephalic, basilic, median cubital and median antebrachial vein surfaces across the forearm, with the radius and ulna for orientation. Choose Left or Right to simplify the view.',
  inspect:
    'Select a named vein to read its existing notes. Isolate a surface, or remove one and use Undo to restore it; return separation to 0% for original source positions. The median cubital surfaces occupy a short elbow region while the other supplied surfaces extend farther along the forearm. Their proximity does not establish a joined lumen, blood flow or a universal venous pattern. Skin, nerves and validated access anatomy are absent; this is not a venepuncture guide or patient registration. Anatomical review is pending.',
  landmarks: ['cephalic vein$', 'basilic vein$', 'median cubital vein$', 'median antebrachial vein$'],
};

export const forearmSuperficialVeinReferences = [
  'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html',
  'https://pubmed.ncbi.nlm.nih.gov/23131916/',
];
