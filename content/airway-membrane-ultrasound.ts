// Original educational synthesis; references are reading links, not imported images or text.
export const airwayMembraneUltrasoundReferences = {
  society: 'https://asra.com/the-asra-family/trainees/trainee-videos/videos/asra-news/2021/08/02/pocus-spotlight-airway',
  volunteerStudy: 'https://pubmed.ncbi.nlm.nih.gov/26297210/',
} as const;

export const airwayMembraneUltrasoundTopics = {
  cricothyroid: {
    body: 'Use the selected median ligament to orient the cricothyroid region between the thyroid and cricoid cartilages. Airway ultrasound teaching describes a bright line across this interval in transverse and sagittal views. Identify the neighbouring cartilages before relating that acquired view to the model.',
    bullets: [
      'The strong echo at the tissue–air boundary is not a segmented image of the ligament. An apparent bright line does not establish the full thickness or extent of this selected surface.',
      'This is membrane-region orientation. It does not establish an independently visible median ligament, a patient-specific boundary or a procedural target.',
    ],
    references: ['society'],
  },
  thyrohyoid: {
    body: 'Orient the thyrohyoid membrane between the hyoid bone and thyroid cartilage. Society teaching describes it as a bright connecting line. In a study of 40 healthy volunteers, investigators identified the membrane but did not visualize the internal branch of the superior laryngeal nerve.',
    bullets: [
      'The right and left Atlas selections are source-model surfaces. The cited study does not validate their separate sonographic boundaries; use the selected side for orientation only.',
      'Seeing the epiglottis through the thyrohyoid window is a different observation from identifying the membrane itself. Neither observation identifies every nearby nerve or validates the model against a scan.',
    ],
    references: ['society', 'volunteerStudy'],
  },
} as const;

export const airwayMembraneUltrasoundNote = 'Educational draft for revision-bound radiologist review. No acquired image, measured tissue thickness, patient registration or procedural instructions are supplied. Existing Atlas, case and lecture access remain independent.';
