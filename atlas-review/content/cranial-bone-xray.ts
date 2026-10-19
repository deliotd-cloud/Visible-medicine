// Original educational wording; reading links only, no third-party figures, images or traces.
export const cranialBoneXrayReferences = {
  skullProjections: 'https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=38',
  sinusProjections: 'https://geiselmed.dartmouth.edu/radiology/wp-content/uploads/sites/47/2021/11/DX-Protocols-2021.pdf#page=32',
  boneRelationships: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/',
  projectionOverlap: 'https://www.radiologyinfo.org/en/info/safety-hiw_04',
} as const;

export const cranialBoneXrayTeaching = {
  frontal: {
    body: 'The frontal bone forms the forehead and orbital roofs. Use this 3D selection to orient the anterior skull before comparing a reviewed radiograph. The cited sinus protocol describes frontal-sinus and orbital context, not an isolated frontal-bone silhouette.',
    bullets: [
      'A frontal sinus is a space within the bone. This whole-bone selection does not validate its internal walls or a patient sinus outline.',
      'Projected lines include overlapping structures; do not assign every line above an orbit to the selected bone.',
    ],
    citations: ['boneRelationships', 'sinusProjections', 'projectionOverlap'],
  },
  parietal: {
    body: 'The paired parietal bones contribute to the lateral skull vault and meet at the sagittal suture. The cited skull protocol includes the parietal region in the Towne view; its PA and lateral descriptions include the cranium.',
    bullets: [
      'A lateral projection combines both sides. Selecting one source-labelled parietal bone does not isolate that side on a radiograph.',
      'Neither this surface nor a named projection confirms visibility of a particular suture. Verify image orientation and side information independently.',
    ],
    citations: ['boneRelationships', 'skullProjections', 'projectionOverlap'],
  },
  temporal: {
    body: 'The temporal bone contributes to the side and base of the skull. Its petrous part contains middle- and inner-ear structures. The cited Towne description includes bilateral temporal, petrous and mastoid regions, not a separate radiographic segmentation of each bone.',
    bullets: [
      'The selected source side must not be transferred to an unregistered image using screen position or apparent symmetry.',
      'This whole-bone surface does not independently label the inner ear, small canals or individual mastoid air cells. Overlapping skull-base anatomy needs its own image context.',
    ],
    citations: ['boneRelationships', 'skullProjections', 'projectionOverlap'],
  },
  occipital: {
    body: 'The occipital bone forms the posterior skull. Its condyles articulate with the atlas. The cited Towne description includes the occipital region and the foramen-magnum relationship of the posterior clinoids; a lateral view includes the cranium from another direction.',
    bullets: [
      'A projected contour is not the complete boundary of this bone. Other skull structures can overlap it.',
      'The selected mesh does not establish patient dimensions, condylar integrity or craniocervical alignment. These require separately reviewed imaging.',
    ],
    citations: ['boneRelationships', 'skullProjections', 'projectionOverlap'],
  },
  sphenoid: {
    body: 'The sphenoid lies centrally in the skull. The sella turcica is a depression on the upper surface of its body. The cited lateral sinus-view description includes the sella, but this landmark does not isolate the entire sphenoid.',
    bullets: [
      'Use the 3D bone to understand location, not as an X-ray trace of its wings, foramina or internal spaces.',
      'A named bony landmark does not establish visibility of the pituitary or nerves. CT and MRI teaching remains separate; no scan correspondence is supplied here.',
    ],
    citations: ['boneRelationships', 'sinusProjections', 'projectionOverlap'],
  },
  ethmoid: {
    body: 'The ethmoid lies between the orbits and contributes to the medial orbital walls. Its air cells are anatomical context. Caldwell and Waters projection descriptions concern orbital and sinus regions, not a proven outline of every ethmoid part.',
    bullets: [
      'The whole-bone mesh does not certify individual air-cell walls or the cribriform plate as separately visible on a radiograph.',
      'An apparent boundary needs its own image context. Selecting this concept does not establish a patient defect, sinus disease or olfactory-pathway finding.',
    ],
    citations: ['boneRelationships', 'sinusProjections', 'projectionOverlap'],
  },
} as const;

export const cranialBoneXrayNote =
  'Original educational draft; revision-bound radiologist sign-off pending. The cited institutional protocol is a historical projection reference, not current acquisition or diagnostic advice. This static source-labelled mesh is not an X-ray image, patient registration or proof of radiographic visibility. Atlas, case and paid-lecture access remain independent.';
