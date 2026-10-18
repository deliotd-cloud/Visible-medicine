// Original plain-film orientation teaching; references support facts only.
export const girdleMuscleXrayReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  scapularCohort: 'https://pubmed.ncbi.nlm.nih.gov/10580821/',
  brachialisCase: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4897327/',
  teresCase: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4861626/',
  elbowGuideline: 'https://acsearch.acr.org/docs/3195154/Narrative',
  elbowGuidelineAbstract: 'https://pubmed.ncbi.nlm.nih.gov/39488347/',
  shoulderGuideline: 'https://pubmed.ncbi.nlm.nih.gov/37236752/',
} as const;

export const girdleMuscleXrayShared = {
  limitation: 'A radiograph shows projected bone and overlapping soft tissue; it cannot establish individual muscle borders or intact muscle or tendon. This static, exploded anatomy pose cannot test scapular winging, denervation or movement.',
  elbow: 'An adolescent brachialis-tear case had radiographs without fracture, dislocation or effusion; MRI showed the tear and hematoma. One case does not measure plain-film sensitivity. Adult acute-elbow guidance separately considers suspected muscle or tendon injury after normal radiographs; this lesson prescribes no imaging pathway.',
  scapula: 'In a selected snapping-scapula cohort, bony incongruity appeared in 7 of 26 affected scapulae on radiographs, 19 on CT and 26 on three-dimensional CT. Those counts do not estimate population sensitivity or establish muscle, nerve or movement function.',
  teres: 'A published isolated teres-major injury case had normal standard radiographs, with the injury demonstrated on MRI. This single case does not measure sensitivity or prescribe MRI coverage.',
  shoulder: 'Shoulder imaging guidance provides clinical context for radiography and further study; these bony landmarks alone cannot establish coracobrachialis integrity or dictate an examination.',
} as const;

export const girdleMuscleXrayTopics = {
  anconeus: {
    body: 'The lateral humeral epicondyle and proximal posterolateral ulna orient anconeus beside the elbow; neither bone outlines its individual fibers.',
    family: 'elbow',
  },
  brachialis: {
    body: 'Trace the anterior distal humerus toward the ulnar coronoid region for brachialis; biceps instead reaches the radius.',
    family: 'elbow',
  },
  coracobrachialis: {
    body: 'The coracoid and medial humeral midshaft bracket coracobrachialis; its attachment does not extend to the elbow.',
    family: 'shoulder',
  },
  'levator-scapulae': {
    body: 'Upper cervical transverse processes and the superior medial scapular border orient levator scapulae across the neck–shoulder junction.',
    family: 'scapula',
  },
  'rhomboid-major': {
    body: 'The upper thoracic spine and medial scapular border below its spine orient rhomboid major, separate from the smaller superior rhomboid.',
    family: 'scapula',
  },
  'rhomboid-minor': {
    body: 'Near the lower cervical–upper thoracic spine, locate the scapular spine root: rhomboid minor meets this level, above major.',
    family: 'scapula',
  },
  'serratus-anterior': {
    body: 'Upper lateral ribs and the rib-facing medial scapular border orient serratus anterior; the selected pose cannot demonstrate winging.',
    family: 'scapula',
  },
  'teres-major': {
    body: 'The inferior scapular region and medial intertubercular humeral attachment orient teres major; this is not a rotator-cuff insertion.',
    family: 'teres',
  },
} as const;
