import type { AxialStudy } from '../lib/axial-anatomy';

export const cubitalReferences = [
  'https://anatomy.ttuhscep.edu/schemes/axilla_ans.html',
  'https://pubmed.ncbi.nlm.nih.gov/23131916/',
];
const bones = ['FMA23130','FMA23131','FMA23464','FMA23465','FMA23467','FMA23468'];
const muscles = ['FMA38486','FMA38487','FMA38560','FMA38561','FMA38562','FMA38563','FMA37668','FMA37669','FMA38513','FMA38514'];
const biceps = ['FMA37684','FMA37685','FMA37686','FMA37687'];
const arteries = ['FMA22691','FMA22692','FMA22733','FMA22734','FMA22797','FMA22798'];
const veins = ['FMA22964','FMA22965','FMA13325','FMA13326','FMA22909','FMA22910'];
const limits = ' Whole surfaces extend beyond the close-up; pan or separate to inspect them. Nerves, skin, fascia and bicipital aponeurosis are not supplied. This is not a complete cubital fossa, verified vessel junction, puncture guide or registered scan. Return separation to 0% for original source positions. Anatomical review is pending.';

// Whole-body scope combines existing arm/forearm records without changing their
// canonical regional assignments or joining, clipping or relabelling surfaces.
export const cubitalStudies: AxialStudy[] = [
  {
    id: 'cubital-muscle-arterial', title: 'Elbow: muscles & arteries',
    regions: ['whole-body'], targetFmaIds: [...muscles, ...arteries],
    context: [{ fmaIds: [...bones, ...biceps] }], view: 'anterior',
    description: 'Compare anterior elbow muscles and the supplied brachial, radial and ulnar arteries. Choose Left or Right for one elbow; the whole-body scope brings arm and forearm sources together.',
    inspect: 'Brachialis and supinator form the anatomical floor context. Compare them with the biceps heads, brachioradialis and pronator teres heads. Select and hide a covering muscle, then Undo to restore it. The biceps tendon is not independently segmented; source proximity does not prove arterial continuity.' + limits,
    landmarks: ['brachial artery$', 'brachialis$', 'supinator$', 'brachioradialis$'],
  },
  {
    id: 'cubital-superficial-veins', title: 'Elbow: superficial veins',
    regions: ['whole-body'], targetFmaIds: veins,
    context: [{ fmaIds: [...bones, ...muscles, ...biceps] }], view: 'anterior',
    description: 'Inspect the supplied median cubital, cephalic and basilic veins against the same elbow muscle and bone context. Arteries are set aside to distinguish this superficial venous view.',
    inspect: 'Superficial cubital venous connections vary; the named median cubital connection is not universal. These source surfaces are one available set, not a complete venous network or a map of safe access. Select a vein to read its existing notes, or extract it and Undo a removal.' + limits,
    landmarks: ['median cubital vein$', 'cephalic vein$', 'basilic vein$'],
  },
];
export const cubitalSourceIds = [...new Set(cubitalStudies.flatMap(s => [
  ...s.targetFmaIds, ...s.context.flatMap(r => r.fmaIds ?? []),
]))];
