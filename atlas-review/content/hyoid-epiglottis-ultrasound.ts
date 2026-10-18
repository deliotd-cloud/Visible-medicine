// Original educational wording and reading link only; no study prose, figures, scans or traces imported.
export const hyoidEpiglottisUltrasoundReferences = {
  upperAirwaySonoanatomy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4126113/',
} as const;

export const hyoidEpiglottisUltrasoundTeaching = {
  hyoid: {
    body: 'On a transverse neck sonogram, the superficial hyoid bone appears as a bright inverted U with a deeper acoustic shadow. In a sagittal view it appears as a curved bright line.',
    bullets: [
      'The shadow blocks a view of tissue behind the bone; it is not the outline of the entire hyoid.',
      'These descriptions come from a study of healthy adults. Its findings do not establish visibility in every neck or acquisition.',
    ],
    citations: ['upperAirwaySonoanatomy'],
  },
  epiglottis: {
    body: 'In the thyrohyoid window, the epiglottis appears as curved, relatively dark tissue. Preepiglottic fat lies anterior to it; a bright air–mucosa interface lies posterior to it.',
    bullets: [
      'Air can obscure deeper structures. A structure unseen in one ultrasound view must not be treated as absent.',
      'The cited healthy-adult study excluded short neck, morbid obesity and abnormal airway anatomy, limiting how broadly its observations apply.',
    ],
    citations: ['upperAirwaySonoanatomy'],
  },
} as const;

export const hyoidEpiglottisUltrasoundNote =
  'Original educational draft; revision-bound radiologist sign-off pending. This static source-labelled mesh is not an ultrasound image, patient registration or evidence of function. No diagnostic or patient-specific inference is supplied. Atlas, case and paid-lecture access remain independent.';
