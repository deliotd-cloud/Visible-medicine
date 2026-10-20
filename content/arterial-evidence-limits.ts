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
    title: 'Inferior thyroid artery: distinguish MRA cases from routine MRI',
    body: 'Two case reports describe neck MR angiography identifying an abnormal inferior thyroid artery: a right-sided course through thyroid tissue in one report and left-sided aneurysms in the other. These selected cases do not establish routine visibility of a normal artery on structural neck MRI.',
    bullets: [
      'On an acquired neck MRA, check the actual acquisition and trace vessel identity, side and parent independently of the Atlas label. Neither report establishes normal-vessel detection rates or visibility across routine structural MRI sequences.',
      'The right-sided variant and left-sided aneurysmal disease belong to separate published cases, not this generic model or the owner’s scans. Colour, calibre and position of this reference surface do not establish either finding.',
      'Learning check: do the reports prove that a normal inferior thyroid artery is visible on every neck MRI? No. They describe individual MRA examinations, without a normal-vessel detection study or a registered MRI-to-Atlas comparison.',
      'This source surface supplies no acquired scan, measured flow, patient registration, verified recurrent laryngeal nerve relationship or validated procedural corridor. Normal-vessel identification evidence remains needed for the intended MRI protocol.',
    ],
    citations: ['https://doi.org/10.7727/wimj.2015.288', 'https://pubmed.ncbi.nlm.nih.gov/25770593/'],
    note: 'Educational draft only; readiness and revision-bound radiologist sign-off remain pending. Atlas, case and lecture access remain independent.',
  },
} as const;
