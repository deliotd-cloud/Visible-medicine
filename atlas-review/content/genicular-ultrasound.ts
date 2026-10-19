import type { ContentSection } from '../app/anatomy-data';

export type GenicularUltrasoundGroup = 'middle' | 'inferior-lateral';

// Original factual summaries only. These references do not supply Atlas images,
// patient-to-model registration, or a bilateral visibility estimate.
const middleReference = 'https://doi.org/10.7600/jpfsm.2.243';
const inferiorLateralReference = 'https://doi.org/10.1007/s00264-023-05977-6';

export const genicularUltrasoundTopics: Record<GenicularUltrasoundGroup, Required<Pick<ContentSection, 'title' | 'body' | 'bullets' | 'citations'>>> = {
  middle: {
    title: 'ultrasound orientation',
    body: 'Watanabe and colleagues used B-mode ultrasound to locate the popliteal and middle genicular arteries, then pulsed Doppler to assess middle genicular blood flow in the right knees of ten healthy young men.',
    bullets: [
      'This shows a study-specific sonographic approach to the named vessel; it does not establish a detection rate or validate left-knee identification.',
      'A Doppler finding in a participant cannot be assigned to this Atlas surface without acquired-image review and registration.',
    ],
    citations: [middleReference],
  },
  'inferior-lateral': {
    title: 'ultrasound orientation',
    body: 'Karimov and Madrakhimov reported day-one postoperative Doppler assessment in 12 selected total-knee-arthroplasty patients who required lateral release. An inferior lateral genicular artery was found in eight of the 12 knees.',
    bullets: [
      'The series included seven right and five left knees, but did not establish a side-specific detection rate or visibility in unoperated knees.',
      'The separate intraoperative transillumination result concerned at least one lateral artery in ten knees; it is not an ultrasound detection figure for the inferior lateral branch.',
    ],
    citations: [inferiorLateralReference],
  },
};
