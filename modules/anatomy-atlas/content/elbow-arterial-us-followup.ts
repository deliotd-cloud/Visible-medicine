// Original factual orientation; publication links are references, never imported media.
export const elbowArterialUsFollowupReferences = {
  recurrentPerforators: 'https://pubmed.ncbi.nlm.nih.gov/9509653/',
  ulnarPerforators: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4229283/',
  radialCollateral: 'https://doi.org/10.7863/ultra.15.01032',
} as const;

type Reference = keyof typeof elbowArterialUsFollowupReferences;
type Family = { body: string; bullets: readonly string[]; citations: readonly Reference[] };
export const elbowArterialUsFollowupTeaching: Record<
  'recurrentInterosseous' | 'anteriorUlnarRecurrent' | 'radialCollateral', Family
> = {
  recurrentInterosseous: {
    body: 'Cheng and colleagues used preoperative Doppler to map skin perforators in 34 patients receiving free posterior interosseous flaps, with operative correlation. In six operations, the main perforator arose from the ascending recurrent interosseous artery. This supports a perforator-mapping context, not ultrasound identification of the whole recurrent artery in routine examinations.',
    bullets: [
      'Distinguish the selected recurrent artery from the posterior and common interosseous parents; a skin perforator is not the complete parent vessel.',
      'The abstract does not establish a standard probe, Doppler threshold or unselected detection rate for this branch.',
      'A static mesh cannot establish lumen, flow, patency, collateral reserve or a patient-specific flap or needle route. Non-visualisation does not prove absence or occlusion.',
    ],
    citations: ['recurrentPerforators'],
  },
  anteriorUlnarRecurrent: {
    body: 'Wei and colleagues reported 29 proximal ulnar perforator flaps in 25 patients, using high-frequency colour ultrasound to locate perforators before flap design. Their separate anatomical study described proximal forearm perforators from the ulnar and anterior ulnar recurrent arteries. These observations do not provide a detection rate for ultrasound visualization of the whole anterior recurrent parent artery.',
    bullets: [
      'Keep the anterior and posterior ulnar recurrent selections distinct. A proximal forearm perforator signal alone does not identify its parent branch.',
      'Do not merge anatomical origin findings with clinical perforator localisation to infer full-branch sonographic visibility.',
      'The source surface supplies no Doppler data, perfusion territory, collateral sufficiency or validated intervention window. This is not a flap-planning protocol.',
    ],
    citations: ['ulnarPerforators'],
  },
  radialCollateral: {
    body: 'Sun and colleagues studied the radial collateral artery with colour Doppler in 15 healthy volunteers and compared their findings with 22 adult cadaveric upper limbs. They assessed origin, course, variation and perforators for lateral upper-arm flap anatomy. This is selected-cohort mapping evidence, not a universal detection rate or a fixed pattern in every learner scan.',
    bullets: [
      'The retained selection is the radial collateral branch of the deep brachial artery, not separate validated segmentations of its posterior branch and every cutaneous perforator.',
      'Compare vessel origin and neighbouring anatomy on acquired images; neither the name nor a vascular signal alone proves correspondence with this reference surface.',
      'The model cannot measure blood flow, calibre, patency or surgical suitability. Keep study mapping distinct from patient-specific diagnosis and intervention planning.',
    ],
    citations: ['radialCollateral'],
  },
};
export const elbowArterialUsFollowupNote =
  'Original educational draft; revision-bound radiologist sign-off pending. No ultrasound images, Doppler data or patient-to-atlas registration are supplied. Reset explode to zero for reference orientation; this does not register an imaging plane or transducer. Atlas, case and paid-lecture access remain independent.';
