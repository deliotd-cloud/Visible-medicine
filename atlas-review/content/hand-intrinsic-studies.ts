import type {AxialStudy} from '../lib/axial-anatomy';

const firstMetacarpals = ['FMA24464', 'FMA24465'];
const metacarpals = [
  'FMA24464', 'FMA24465', 'FMA24466', 'FMA24467', 'FMA24468',
  'FMA24469', 'FMA24470', 'FMA24471', 'FMA24472', 'FMA24473',
];
const thenarAdductor = [
  'FMA37386', 'FMA37387', 'FMA37390', 'FMA37391',
  'FMA46121', 'FMA46122', 'FMA46123', 'FMA46124',
];
const interosseousLumbrical = [
  'FMA42398', 'FMA42399', 'FMA42402', 'FMA42403', 'FMA42404', 'FMA42405',
];
const limits = ' These are unchanged, separately selectable source surfaces; proximity does not establish attachments, layers or movement. No tendon, aponeurosis, retinaculum, nerve or complete hand dissection is supplied by this study. Return separation to 0% for original source positions. Anatomical review is pending.';

export const handIntrinsicStudies: AxialStudy[] = [
  {
    id: 'hand-intrinsic-thenar-adductor',
    title: 'Hand: thenar & adductor source groups',
    regions: ['hand'],
    targetFmaIds: thenarAdductor,
    context: [{fmaIds: firstMetacarpals}],
    view: 'anterior',
    description: 'Compare the supplied abductor pollicis brevis, opponens pollicis and two adductor pollicis head surfaces with first-metacarpal context. Choose Left or Right for one hand.',
    inspect: 'Select a labelled surface and Remove it, then Undo to restore it. Extract selected can separate that whole surface without changing the source geometry.' + limits,
    landmarks: ['abductor pollicis brevis$', 'opponens pollicis$', 'oblique head of .*adductor pollicis$', 'transverse head of .*adductor pollicis$'],
  },
  {
    id: 'hand-intrinsic-interosseous-lumbrical',
    title: 'Hand: interosseous & lumbrical source groups',
    regions: ['hand'],
    targetFmaIds: interosseousLumbrical,
    context: [{fmaIds: metacarpals}],
    view: 'anterior',
    description: 'Compare the supplied grouped lumbrical, palmar interosseous and dorsal interosseous surfaces with metacarpal context. Choose Left or Right for one hand.',
    inspect: 'Each target is one grouped source surface on its side; individual numbered muscles are not separately supplied. Select a group and Remove it, then Undo to restore it.' + limits,
    landmarks: ['set of lumbricals of .* hand$', 'set of palmar interossei of .* hand$', 'set of dorsal interossei of .* hand$'],
  },
];

export const handIntrinsicSourceIds = [...new Set(handIntrinsicStudies.flatMap(study => [
  ...study.targetFmaIds, ...study.context.flatMap(rule => rule.fmaIds ?? []),
]))];
