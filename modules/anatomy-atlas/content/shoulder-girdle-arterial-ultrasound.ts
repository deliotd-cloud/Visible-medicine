// Original educational drafts. Reading links provide evidence, not imported images, traces or prose.
export const shoulderGirdleArterialUltrasoundReferences = {
  posteriorCircumflexHumeral: 'https://pubmed.ncbi.nlm.nih.gov/27255398/',
  circumflexScapular: 'https://pubmed.ncbi.nlm.nih.gov/20489408/',
  thyrocervical: 'https://pubmed.ncbi.nlm.nih.gov/27909611/',
  costocervical: 'https://pubmed.ncbi.nlm.nih.gov/12917117/',
  dorsalScapularUltrasound: 'https://pubmed.ncbi.nlm.nih.gov/22523422/',
  dorsalScapularAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/37179441/',
} as const;

type Reference = keyof typeof shoulderGirdleArterialUltrasoundReferences;
type Family = { body: string; bullets: readonly string[]; citations: readonly Reference[] };

export const shoulderGirdleArterialUltrasoundTeaching: Record<
  'posteriorCircumflexHumeral' | 'circumflexScapular' | 'thyrocervical' | 'costocervical' | 'dorsalScapular',
  Family
> = {
  posteriorCircumflexHumeral: {
    body: 'The posterior circumflex humeral artery is a candidate branch to distinguish from the deep brachial artery near the proximal arm. In a study of elite volleyball players, sonographers assessed branch origin and course: an axillary-origin posterior circumflex branch commonly curved dorsally towards the humeral head, whereas an axillary-origin deep brachial branch commonly followed a straighter course. Those observations describe the studied athletes and branching patterns, not a universal rule for this source-labelled segment.',
    bullets: [
      'Relate an observed branch to the axillary artery and humeral head on acquired grey-scale and Doppler images; follow continuity before naming it. A single coloured focus is insufficient.',
      'Alternative origins and courses occur. An unseen segment in one acoustic window cannot establish absence, occlusion or which branch the atlas donor represents.',
      'Study detection and vessel measurements from an elite-athlete cohort are not visibility promises, normal thresholds or diagnostic findings for a learner case.',
    ],
    citations: ['posteriorCircumflexHumeral'],
  },
  circumflexScapular: {
    body: 'The circumflex scapular artery belongs to the scapular arterial pathway and can be discussed separately from its cutaneous perforators. An original cadaver and volunteer Doppler investigation delineated the circumflex scapular axis and perforators. Its observations support a teaching distinction between the parent artery, bifurcation and smaller skin-directed branches; a perforator signal alone does not map the whole parent trunk. The study population and flap-oriented assessment do not establish routine visibility of every segment.',
    bullets: [
      'Compare a candidate arterial signal with the scapular region and trace it on acquired images before assigning the circumflex scapular name.',
      'A demonstrated perforator is not proof that every proximal branch or collateral connection has been imaged; the selected surface is not a skin-perforator map.',
      'No Doppler velocity, patency, complete collateral route or reconstructive suitability follows from the reference mesh or this draft.',
    ],
    citations: ['circumflexScapular'],
  },
  thyrocervical: {
    body: 'The thyrocervical trunk is a short branch in the lower-neck subclavian region. A published sonographic observation in one adult placed it relative to the subclavian artery and internal jugular vein, and distinguished it from the nearby vertebral artery. This is an orientation example from one examination, not a standardized detection rate or a fixed depth for either side. The atlas surface supplies a named branch to compare conceptually with an acquired scan, but cannot determine the actual branch origin in that scan.',
    bullets: [
      'If visible, use continuity with the acquired subclavian image to distinguish the trunk from a nearby vertebral or other arterial signal.',
      'Branching and acoustic access may differ. Do not transfer the reported volunteer position or depth into a learner case as a patient-specific measurement.',
      'The displayed surface does not validate its complete daughter branches, Doppler flow, patency or a safe intervention path.',
    ],
    citations: ['thyrocervical'],
  },
  costocervical: {
    body: 'A sonographic mapping study of the brachial plexus used the deep cervical artery as a landmark near the lower cervical roots and described it as arising from the costocervical artery. That observation concerns a daughter branch, not documented detection of the complete costocervical parent. The source-labelled parent trunk can orient an anatomy discussion about the subclavian and deep cervical pathways, but a branch signal must not be promoted into proof of the whole trunk or its exact junction in an individual scan.',
    bullets: [
      'Keep the deep cervical landmark and the costocervical parent distinct when reading an acquired image; follow the visible continuity before assigning a vessel name.',
      'A reported relationship near C7 and C8 is an anatomical orientation, not proof that these roots or their neighbouring artery are resolved in every examination.',
      'The static model gives no sonographic detection rate, patient-specific depth, full parent course, Doppler result or validated nerve geometry.',
    ],
    citations: ['costocervical'],
  },
  dorsalScapular: {
    body: 'In a healthy-volunteer ultrasound study, dorsal scapular artery detection changed with probe position in the supraclavicular region. That result illustrates the limits of one acoustic window; a vessel not seen there is not absent. Separate cadaveric work documented more than one possible origin, including transverse cervical and direct subclavian pathways. Cadaver anatomy informs variation, but it is not evidence of ultrasound performance or of the origin in a particular learner case.',
    bullets: [
      'On acquired images, trace a candidate artery proximally before assigning its origin; the neighbouring transverse cervical pathway can complicate a single-view identification.',
      'Do not infer a fixed relationship to brachial plexus elements from this surface. The model does not contain validated nerve geometry or a registered sonogram.',
      'The volunteer detection results do not establish a general screening rate, and no absent vessel, patency result or procedural target follows from one view.',
    ],
    citations: ['dorsalScapularUltrasound', 'dorsalScapularAnatomy'],
  },
};

export const shoulderGirdleArterialUltrasoundNote =
  'Original educational draft; revision-bound radiologist sign-off pending. This source-labelled reference surface supplies no sonogram, Doppler pixels or measurement and has no patient-to-atlas registration. No diagnostic, procedural or patient-specific inference is supplied. Atlas, case and paid-lecture access remain independent.';
