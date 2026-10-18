import type { AxialStudy } from '../lib/axial-anatomy';
export const tentoriumStudySets: AxialStudy[] = [
  {
    id: 'tentorium-source',
    title: 'Tentorium: supplied right portion',
    regions: ['head-neck', 'whole-body'],
    targetFmaIds: ['FMA83966'],
    context: [{ fmaIds: ['FMA52735', 'FMA52738', 'FMA52736'] }],
    view: 'superior',
    description:
      'Set the brain and overlying skull aside; keep the incomplete right-sided dural fold with occipital, right temporal and sphenoid context. Choose Both or Right.',
    inspect:
      'Rotate to inspect the sloping fold. Only a right-sided source surface is present: no left counterpart or complete notch has been generated. Bones are orientation, not validated attachment footprints; remove them individually to isolate the fold. Undo restores visibility. Separation is not tissue movement or a surgical approach.',
    landmarks: [
      'tentorium',
      'occipital bone',
      'right temporal bone',
      'sphenoid bone',
    ],
  },
];
