import type { AxialStudy } from '../lib/axial-anatomy';
export const longusColliReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html',
  'https://www.stritch.luc.edu/lumen/meded/grossanatomy/homepage/muscletables/head-neckmuscletable.pdf',
];
export const longusColliStudySets: AxialStudy[] = [
  {
    id: 'longus-colli-left',
    title: 'Longus colli: supplied left parts',
    regions: ['head-neck', 'spine', 'whole-body'],
    targetFmaIds: ['FMA46284', 'FMA46286', 'FMA46288'],
    context: [
      {
        fmaIds: [
          'FMA12519',
          'FMA12520',
          'FMA12521',
          'FMA12522',
          'FMA12523',
          'FMA12524',
          'FMA12525',
          'FMA9165',
          'FMA9187',
          'FMA9209',
          'FMA52735',
          'FMA46310',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Expose the three supplied left longus-colli parts against available vertebral context. Choose Both or Left; no right counterpart has been generated.',
    inspect:
      'Select the superior oblique, vertical or inferior oblique part; hide a covering structure or extract one part, then Undo or reset separation. Whole body includes all retained vertebral, occipital and longus-capitis context. Head & neck omits upper-thoracic and longus-capitis context; Spine omits the occipital bone. Existing source memberships are preserved. Attachment levels and fascial planes remain unvalidated; this is not surgical retraction or simulated motion.',
    landmarks: [
      'superior oblique part of left longus colli',
      'vertical intermediate part of left longus colli',
      'inferior oblique part of left longus colli',
      'atlas$',
      'left longus capitis$',
    ],
  },
];
