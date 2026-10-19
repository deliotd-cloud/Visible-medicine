import type { AxialGroup, AxialStudy } from './axial-anatomy';
const references = ['https://anatomy.ttuhscep.edu/schemes/larynx_tables.html'];
const caution =
  'Unvalidated source subset. Shape, side, attachment footprints and tissue boundaries require specialist review. Conus elasticus, aryepiglotticus and pterygomandibular raphe candidates are withheld, as are the previous pharyngeal raphe and middle constrictors. No complete mucosal layers, airway lumen, laryngeal nerves, swallowing, phonation or operative planes are simulated.';
const vocal = ['FMA55245', 'FMA55246', 'FMA46592', 'FMA46593'];
const posterior = [
  'FMA46577',
  'FMA46578',
  'FMA46580',
  'FMA46581',
  'FMA46584',
  'FMA46585',
  'FMA46582',
];
const pharyngeal = [
  'FMA46631',
  'FMA46632',
  'FMA46635',
  'FMA46636',
  'FMA46667',
  'FMA46668',
  'FMA46669',
  'FMA46670',
  'FMA46671',
  'FMA46672',
];
export const laryngealGroups: AxialGroup[] = [
  {
    id: 'thyrohyoid-membrane-detail',
    name: 'Thyrohyoid membrane sources',
    fmaIds: ['FMA55133', 'FMA55134'],
    anatomy:
      'The thyrohyoid membrane spans between the hyoid and thyroid cartilage. The median and lateral thyrohyoid ligaments are associated thickenings; the source supplies the membrane sides separately.',
    function:
      'Supports the suspension of the larynx from the hyoid. Attachments and perforating structures are not validated by these surfaces.',
    caution,
    references,
  },
  {
    id: 'vocal-ligament-muscle-detail',
    name: 'Vocal ligament and vocalis sources',
    fmaIds: vocal,
    anatomy:
      'Vocal ligaments connect the thyroid cartilage to the arytenoid vocal processes. Vocalis lies alongside; the overlying mucosal fold is not a separately validated surface here.',
    function:
      'These tissues contribute to voice production. Compare their supplied positions; no tension, vibration or sound is simulated.',
    caution,
    references,
  },
  {
    id: 'intrinsic-laryngeal-muscle-detail',
    name: 'Selected intrinsic laryngeal muscles',
    fmaIds: posterior,
    anatomy:
      'Posterior and lateral cricoarytenoids connect the cricoid and arytenoid cartilages. Oblique and transverse arytenoid sources span the arytenoid region.',
    function:
      'Posterior cricoarytenoids abduct the vocal folds; lateral cricoarytenoids and arytenoids contribute to adduction. The atlas shows static source shapes, not validated movement.',
    caution,
    references,
  },
  {
    id: 'pharyngeal-muscle-detail',
    name: 'Selected pharyngeal muscle sources',
    fmaIds: pharyngeal,
    anatomy:
      'This subset contains superior and inferior constrictors with the supplied longitudinal pharyngeal muscles. The middle constrictors and pharyngeal raphe remain withheld.',
    function:
      'Constrictors narrow the pharyngeal passage; longitudinal muscles contribute to elevation. Coordinated swallowing is not modelled.',
    caution,
    references,
  },
];
export const laryngealGroupFor = (fmaId: string) =>
  laryngealGroups.find((g) => g.fmaIds.includes(fmaId));
export const laryngealStudySets: AxialStudy[] = [
  {
    id: 'thyrohyoid-membrane-window',
    title: 'Thyrohyoid membranes & suspension',
    regions: ['head-neck'],
    targetFmaIds: laryngealGroups[0].fmaIds,
    context: [
      { fmaIds: ['FMA52749', 'FMA55099', 'FMA55138', 'FMA55140', 'FMA55141'] },
    ],
    view: 'anterior',
    description:
      'Inspect the paired membrane sources between the hyoid and thyroid cartilage, with the three thyrohyoid ligaments as context.',
    inspect:
      'Choose a side, frame a membrane, and set a ligament or cartilage aside. Undo restores the original relationship. This is a static study window, not a complete membrane attachment or surgical-plane model.',
    landmarks: ['thyrohyoid membrane', 'hyoid bone', 'thyroid cartilage'],
  },
  {
    id: 'vocal-ligament-muscle-window',
    title: 'Vocal ligaments & vocalis',
    regions: ['head-neck'],
    targetFmaIds: vocal,
    context: [{ fmaIds: ['FMA55113', 'FMA55114', 'FMA9615', 'FMA55099'] }],
    view: 'superior',
    description:
      'Compare the fine vocal-ligament and vocalis sources with the arytenoid, cricoid and thyroid framework.',
    inspect:
      'Set the thyroid cartilage aside and look from above, then restore it. Frame or isolate a fine structure for source-name practice. Conus elasticus and complete mucosal folds are not included; the apparent opening is not a validated airway lumen.',
    landmarks: ['vocal ligament', 'vocalis', 'arytenoid cartilage'],
  },
  {
    id: 'posterior-laryngeal-muscle-window',
    title: 'Posterior laryngeal muscle subset',
    regions: ['head-neck'],
    targetFmaIds: posterior,
    context: [{ fmaIds: ['FMA9615', 'FMA55113', 'FMA55114'] }],
    view: 'posterior',
    description:
      'Expose selected intrinsic laryngeal muscles with a small cricoid and arytenoid framework.',
    inspect:
      'Select the posterior cricoarytenoid, compare it with the lateral muscle and arytenoid sources, and use reversible separation if needed. Paired source names and crossing fibres do not establish verified attachments or movements.',
    landmarks: [
      'posterior crico-arytenoid',
      'lateral crico-arytenoid',
      'transverse arytenoid',
    ],
  },
  {
    id: 'pharyngeal-muscle-window',
    title: 'Pharyngeal muscles exposed',
    regions: ['head-neck'],
    targetFmaIds: pharyngeal,
    context: [{ fmaIds: ['FMA52749', 'FMA55099'] }],
    view: 'posterior',
    description:
      'Study the superior/inferior constrictors and longitudinal muscle sources with hyoid and thyroid-cartilage context.',
    inspect:
      'Remove one supplied muscle, compare the retained sources, then Undo. This sparse subset omits the middle constrictors, raphes and mucosal wall; it must not be interpreted as a complete pharyngeal dissection or swallowing model.',
    landmarks: [
      'superior pharyngeal constrictor',
      'inferior pharyngeal constrictor',
      'stylopharyngeus',
    ],
  },
];
