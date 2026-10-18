// Original source-bound teaching drafts; links are reading references only.
export const arterialEvidenceLimits = {
  middleCollateralUltrasound: {
    title: 'Middle collateral: follow the branch identity',
    body: 'Casoli and colleagues dissected 69 upper limbs, distinguishing the middle collateral artery from the posterior radial collateral and finding variable origin levels. Cadaveric anatomy cannot establish routine ultrasound visibility.',
    bullets: [
      'Learning prompt: on acquired Doppler, what branch origin and course support this identity rather than a nearby vessel name?',
      'Sun and colleagues studied 15 volunteers and 22 cadaveric limbs, tracing radial collateral to posterior radial collateral to perforator. This is not direct middle collateral validation.',
      'Needed: direct sonographic branch identity across variants. This vessel surface supplies no acquired scan, Doppler flow, patency measurement, probe registration or validated procedural corridor.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/14730394/', 'https://pubmed.ncbi.nlm.nih.gov/26969598/'],
    note: 'Educational draft only; readiness and revision-bound radiologist sign-off remain pending. Atlas, case and lecture access remain independent.',
  },
  inferiorThyroidMri: {
    title: 'Inferior thyroid artery: MRA is a distinct examination',
    body: 'A 2015 case report described an aneurysmal inferior thyroid artery identified by neck MR angiography. Disease-related conspicuity does not establish normal-artery visibility on routine structural MRI.',
    bullets: [
      'Learning prompt: which acquired sequence depicts the vessel, and can its origin and side be traced independently of this label?',
      'Do not transfer the MRA case finding to routine structural MRI or infer a lesion from this static surface.',
      'Needed: normal-vessel identification evidence for the intended MRI protocol. This source surface supplies no acquired scan, measured flow, patient registration or validated procedural corridor.',
    ],
    citations: ['https://www.ajemjournal.com/article/S0735-67571500051-0/fulltext'],
    note: 'Educational draft only; readiness and revision-bound radiologist sign-off remain pending. Atlas, case and lecture access remain independent.',
  },
} as const;
