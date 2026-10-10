// Original educational wording; reference links only, with no third-party figures or patient images.
export const facialBoneXrayReferences = {
  boneRelationships: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/',
  facialProjections: 'https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=12',
  archProjections: 'https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=45',
  projectionOverlap: 'https://www.radiologyinfo.org/en/info/safety-hiw_04',
} as const;

export const facialBoneXrayTeaching = {
  maxilla: {
    body: 'The maxilla forms much of the midface. Its orbital surface contributes to the orbital floor above the maxillary sinus; the alveolar process supports upper teeth, and the palatine process contributes to the hard palate. Use the selected side to orient these relationships in 3D.',
    bullets: [
      'A historical facial-bone Waters projection includes the maxillary sinus and orbital margins. That regional view does not isolate this maxilla or prove visibility of its individual sinus walls.',
      'Projected structures overlap. Confirm side and orientation on a separately reviewed image; this mesh has no patient-image registration.',
    ],
    citations: ['boneRelationships', 'facialProjections', 'projectionOverlap'],
  },
  zygomatic: {
    body: 'The zygomatic bone forms the cheek and contributes to the lateral orbital rim and floor. Its temporal process meets the temporal bone to form the zygomatic arch. This whole-bone selection includes more than the zygomatic part of the arch.',
    bullets: [
      'The historical facial-bone Waters and submentovertex descriptions include the arches; the separate arch protocol also names Waters and SMV views. An arch contour includes a temporal-bone contribution.',
      'Projection overlap and this source surface do not establish an individual radiographic outline, patient side or image registration.',
    ],
    citations: ['boneRelationships', 'facialProjections', 'archProjections', 'projectionOverlap'],
  },
} as const;

export const facialBoneXrayNote =
  'Original educational draft; revision-bound radiologist sign-off pending. The cited 2021 protocol is a historical projection reference, not current acquisition or diagnostic advice. This static source-labelled mesh provides semantic 3D orientation, not patient registration or proof of radiographic visibility. Atlas, case and paid-lecture access remain independent.';
