import type {AxialStudy} from '../lib/axial-anatomy';

const targets = [
  'FMA3941', 'FMA4058', 'FMA4754', 'FMA4762',
  'FMA3953', 'FMA4694', 'FMA4755', 'FMA4763',
  'FMA13392', 'FMA13393', 'FMA13390', 'FMA13391',
  'FMA13388', 'FMA13389',
];
const context = ['FMA13408', 'FMA13409', 'FMA13348', 'FMA13349'];

export const lowerNeckStudy: AxialStudy = {
  id: 'lower-neck-vessels-scalenes',
  title: 'Lower neck: vessels & scalenes',
  regions: ['head-neck', 'whole-body'],
  targetFmaIds: targets,
  context: [{fmaIds: context}],
  view: 'anterior',
  description: 'Compare the supplied bilateral common-carotid, internal-jugular, subclavian and scalene source surfaces with sternocleidomastoid and omohyoid context. Start anteriorly, then rotate the unchanged source frame.',
  inspect: 'Select a labelled surface and Remove it, then Undo to restore it. Extract selected separates that whole source surface; return separation to 0% to restore its original source position. This is source orientation only, not proof of a complete neck, operative planes, vascular patency or branching, or CT/ultrasound registration. Nerves, skeleton and a cervical-sheath model are not supplied by this study. Anatomical review is pending.',
  landmarks: [
    'common carotid artery$',
    'internal jugular vein$',
    'subclavian artery$',
    'subclavian vein$',
    'scalenus anterior$',
    'scalenus medius$',
    'scalenus posterior$',
  ],
};

export const lowerNeckSourceIds = [
  ...lowerNeckStudy.targetFmaIds,
  ...lowerNeckStudy.context.flatMap(rule => rule.fmaIds ?? []),
];
