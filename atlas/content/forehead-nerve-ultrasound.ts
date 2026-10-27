// Original text only. Cited publications do not supply reusable images or figures.
const bink = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10566885/';
const berchtold = 'https://pubmed.ncbi.nlm.nih.gov/28712884/';
const note = 'Didanix Education/light research draft. No acquired image, patient-space registration or validated model-to-image match is supplied. Revision-bound radiologist sign-off remains pending; Atlas, case and lecture access remain independent.';

export const foreheadNerveUltrasoundTopics = {
  supraorbital: {
    body: 'Researchers reported ultrasound identification and measurements of the supraorbital nerve at selected forehead sites in 60 healthy volunteers using a 12 MHz probe. Measurements were made on either side; this was not a demonstrated bilateral survey of each participant.',
    bullets: [
      'A separate anatomical study dissected 22 embalmed facial halves and studied the named nerve with ultrasound, but its abstract does not establish the ultrasound sample count or per-nerve confirmation rate.',
      'The labelled Atlas surface is unvalidated. A nearby notch or artery alone does not identify the nerve; selected-site imaging does not prove its branches or entire course.',
      'No diagnostic threshold, patient-space registration, image-to-mesh validation or individual-side visibility rate is established here.',
    ],
    citations: [bink, berchtold],
    note,
  },
  supratrochlear: {
    body: 'Ultrasound research has measured the supratrochlear nerve at selected forehead sites, including near the corrugator supercilii. The 60-volunteer study used a 12 MHz probe and measured either side rather than scanning both sides in each participant.',
    bullets: [
      'The separate cadaver and ultrasound report investigated this named nerve and its relation to corrugator supercilii; the accessible abstract does not give an ultrasound sample count or individual identification accuracy.',
      'The labelled Atlas surface is unvalidated. Vessel proximity does not by itself identify a nerve, and these observations do not demonstrate branches or an entire nerve course.',
      'No diagnostic threshold, patient-space registration, image-to-mesh validation or individual-side visibility rate is established here.',
    ],
    citations: [bink, berchtold],
    note,
  },
} as const;
