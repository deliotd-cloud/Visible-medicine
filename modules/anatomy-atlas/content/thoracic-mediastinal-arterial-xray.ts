// Original factual teaching. References are reading links, not reusable media.
const anatomy = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-thorax/';
const angiography = 'https://www.radiologyinfo.org/en/info/angiocath';
const archStudy = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2588331/';
const bronchialStudy = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8183775/';
const oesophagealStudy = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2702045/';

export const thoracicMediastinalArterialXrayTopics = {
  'brachiocephalic-artery': {
    title: 'Brachiocephalic trunk angiographic orientation',
    body: 'The brachiocephalic trunk usually leaves the aortic arch and divides into the right common carotid and right subclavian arteries. In a contrast catheter angiogram, identify the demonstrated arch origin and branch destinations before naming a projected segment.',
    bullets: [
      'This is an artery, not either brachiocephalic vein. The usual arterial destination is right-sided even though the retained source record classifies this central selection as midline; that classification is not a patient-side marker.',
      'A 25-cadaver arch study documented branching variation. A common origin with the left common carotid and separate origins are not interchangeable patterns; neither the usual description nor this single donor surface establishes the pattern in a patient.',
      'Plain chest radiography may provide mediastinal context but does not delineate the contrast-filled branching lumen. Do not diagnose stenosis or dissection from an atlas surface or a single projected contour.',
    ],
    citations: [anatomy, archStudy, angiography],
  },
  'bronchial-artery': {
    title: 'Bronchial arterial angiographic orientation',
    body: 'Bronchial arteries provide systemic arterial supply to airway tissues, distinct from the pulmonary arterial circulation. Contrast catheter angiography can depict selected bronchial branches; trace the demonstrated parent vessel and airway-directed course rather than assuming one fixed origin or one artery on each side.',
    bullets: [
      'A study of 600 patients with haemoptysis used CT and digital subtraction angiography to assess bronchial origins. It found both descending-aortic and ectopic origins; this disease-selected cohort does not establish routine normal visibility or prevalence in every population.',
      'An intercostobronchial trunk or another systemic artery may overlap in projection. This source selection does not resolve every bronchial branch, a spinal arterial connection or a safe embolisation route.',
    ],
    citations: [anatomy, bronchialStudy, angiography],
  },
  'variant-bronchial-artery': {
    title: 'Variant-labelled bronchial angiographic orientation',
    body: 'This retained source is labelled variant bronchial artery; its component also has a bronchial-branch-of-aortic-arch alias, FMA14177. It remains one selection, not an extra artery or proof that the represented origin is a universal normal pattern.',
    bullets: [
      'The 600-patient haemoptysis study demonstrated ectopic bronchial origins, including arch origins, on CT and digital subtraction angiography. It does not validate this donor component or provide a routine normal visibility rate.',
      'In an acquired contrast catheter angiogram, establish the actual origin and course from the complete study. The source alias, red colour or apparent contact with the arch cannot identify a patient branch, establish a patent junction or prescribe a procedural route.',
    ],
    citations: [bronchialStudy, angiography],
  },
  'esophageal-artery': {
    title: 'Oesophageal arterial angiographic orientation',
    body: 'Oesophageal arterial supply includes thoracic-aortic branches and contributions from the left gastric artery. This individual source-labelled surface is not the complete oesophageal arterial network. Contrast catheter angiography depicts the branches actually opacified in that examination, not every possible supply route.',
    bullets: [
      'A five-patient arterial-bleeding series demonstrated oesophageal feeders from the aorta in four patients and the left inferior phrenic artery in one. These pathological examples are not a routine normal visibility rate or an atlas-to-patient match.',
      'Distinguish arterial contrast extravasation from venous varices and from the oesophageal lumen. Surface separation or apparent contact with another vessel cannot establish an anastomosis, bleeding focus or treatment route.',
    ],
    citations: [anatomy, oesophagealStudy, angiography],
  },
  'esophageal-branches': {
    title: 'Grouped oesophageal branches angiographic orientation',
    body: 'The set of oesophageal branches of the thoracic aorta remains a grouped source identity. It has not been split into individually named branches. A projected angiographic feeder cannot be assigned to an individual member merely by matching this group label or its model silhouette.',
    bullets: [
      'The five-patient arterial-bleeding series illustrates selected aortic and inferior-phrenic oesophageal feeders. A disease-selected angiogram is not a catalogue of all normal branches; the retained group does not establish the number or connections in a patient.',
      'Use the demonstrated parent vessel and serial contrast images to describe a branch in an acquired study. Reassemble the reference atlas for orientation, but do not treat the grouped surface ends as verified arterial junctions or a complete supply territory.',
    ],
    citations: [anatomy, oesophagealStudy, angiography],
  },
} as const;
