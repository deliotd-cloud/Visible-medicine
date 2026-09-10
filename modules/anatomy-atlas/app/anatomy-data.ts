import { pendingXrayLesson, shoulderXrayLesson } from '../lib/xray-teaching.ts';

export type SystemKey = 'skeleton' | 'muscles' | 'soft-tissue';
export type ContentTab =
  | 'anatomy'
  | 'function'
  | 'ct'
  | 'mri'
  | 'xray'
  | 'ultrasound'
  | 'pathology'
  | 'clinical'
  | 'quiz';

export type ContentSection = {
  readiness?:
    'draft' | 'pending' | 'identity-only' | 'generated-identification';
  title: string;
  body: string;
  bullets?: string[];
  note?: string;
  citations?: string[];
};

export type AnatomyStructure = {
  id: string;
  shortId: string;
  name: string;
  latinName: string;
  category: 'bone' | 'muscle' | 'tendon';
  system: SystemKey;
  region: string;
  laterality: 'right';
  color: string;
  synonyms: string[];
  sourceFmaIds?: string[];
  sections: Record<ContentTab, ContentSection>;
};

const sharedImagingNote =
  'Prototype teaching copy — verify against an approved imaging reference and local protocol before clinical release.';

export const structures: AnatomyStructure[] = [
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:bone:scapula',
    shortId: 'VM-SHO-R-BON-SCAP',
    name: 'Scapula',
    latinName: 'Scapula dextra',
    category: 'bone',
    system: 'skeleton',
    region: 'Shoulder girdle',
    laterality: 'right',
    color: '#e7dfcf',
    synonyms: ['shoulder blade', 'glenoid', 'acromion'],
    sections: {
      xray: shoulderXrayLesson('scapula'),
      anatomy: {
        title: 'Overview',
        body: 'A flat triangular bone linking the upper limb to the axial skeleton through the clavicle. Its lateral angle forms the glenoid fossa.',
        bullets: [
          'Borders: superior, medial and lateral',
          'Processes: spine, acromion and coracoid',
          'Articulations: clavicle and humeral head',
        ],
      },
      function: {
        title: 'Mechanical role',
        body: 'Provides a mobile platform for glenohumeral motion and a broad attachment surface for stabilising muscles.',
        bullets: [
          'Upward rotation supports arm elevation',
          'Retraction and protraction position the glenoid',
          'Scapulothoracic motion contributes to shoulder rhythm',
        ],
      },
      ct: {
        title: 'CT appearance',
        body: 'Cortical margins are high attenuation with a cancellous medullary centre. Multiplanar review is useful for the glenoid, acromion and fracture planes.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'Marrow signal varies with sequence and age; the cortical shell remains low signal. Review the glenoid labral interface and muscle attachments.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound window',
        body: 'Only accessible cortical surfaces are seen as a bright line with posterior acoustic shadow. Ultrasound is not the primary modality for the whole scapula.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Trauma may involve the body, neck, glenoid or processes. Morphology of the acromion and glenoid can alter shoulder mechanics.',
        bullets: [
          'Scapular fractures',
          'Glenoid rim injury',
          'Os acromiale and degenerative change',
        ],
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Scapular position and control are assessed alongside cuff strength and glenohumeral range.',
        bullets: [
          'Look for winging',
          'Compare resting position side-to-side',
          'Correlate focal tenderness with trauma history',
        ],
      },
      quiz: {
        title: 'Quick check',
        body: 'Which part of the scapula articulates with the humeral head?',
        bullets: ['Glenoid fossa', 'Coracoid process', 'Inferior angle'],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:bone:humerus',
    shortId: 'VM-SHO-R-BON-HUM',
    name: 'Proximal humerus',
    latinName: 'Humerus proximalis dexter',
    category: 'bone',
    system: 'skeleton',
    region: 'Glenohumeral joint',
    laterality: 'right',
    color: '#f1eadc',
    synonyms: ['humeral head', 'greater tuberosity', 'lesser tuberosity'],
    sections: {
      xray: shoulderXrayLesson('humerus'),
      anatomy: {
        title: 'Overview',
        body: 'The hemispherical humeral head articulates with the shallow glenoid. The anatomical and surgical necks separate the head, tuberosities and shaft.',
        bullets: [
          'Greater tuberosity: superior and posterior cuff insertions',
          'Lesser tuberosity: subscapularis insertion',
          'Intertubercular groove: long-head biceps tendon',
        ],
      },
      function: {
        title: 'Mechanical role',
        body: 'Acts as the mobile lever of the upper limb while the rotator cuff centres the head on the glenoid.',
      },
      ct: {
        title: 'CT appearance',
        body: 'CT defines cortical disruption, tuberosity displacement and joint congruity with high spatial resolution.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'MRI can assess marrow, cartilage, cuff insertions and the biceps anchor around the proximal humerus.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound window',
        body: 'The greater and lesser tuberosities form bright cortical landmarks for assessing cuff insertions and the bicipital groove.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Important entities include proximal humeral fracture, impaction defects, degenerative change and avascular necrosis.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Examine active and passive range, pain localisation and neurovascular status following trauma.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Which groove contains the long-head biceps tendon?',
        bullets: [
          'Intertubercular groove',
          'Radial groove',
          'Suprascapular notch',
        ],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:bone:clavicle',
    shortId: 'VM-SHO-R-BON-CLAV',
    name: 'Clavicle',
    latinName: 'Clavicula dextra',
    category: 'bone',
    system: 'skeleton',
    region: 'Shoulder girdle',
    laterality: 'right',
    color: '#dfd5c1',
    synonyms: ['collarbone', 'acromioclavicular joint', 'ac joint'],
    sections: {
      xray: shoulderXrayLesson('clavicle'),
      anatomy: {
        title: 'Overview',
        body: 'An S-shaped strut joining the sternum to the acromion and maintaining the shoulder away from the thorax.',
        bullets: [
          'Medial sternoclavicular articulation',
          'Lateral acromioclavicular articulation',
          'Conoid and trapezoid ligament attachments',
        ],
      },
      function: {
        title: 'Mechanical role',
        body: 'Transmits load from upper limb to axial skeleton and permits coordinated scapular rotation.',
      },
      ct: {
        title: 'CT appearance',
        body: 'CT is useful for complex fractures and alignment at the sternoclavicular joint.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'MRI is reserved for selected marrow, joint and ligament questions.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound window',
        body: 'Superficial cortical contour and the acromioclavicular joint can be assessed dynamically.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Midshaft fracture and acromioclavicular joint injury are common traumatic patterns.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Inspect for contour change, skin tenting and local tenderness after injury.',
      },
      quiz: {
        title: 'Quick check',
        body: 'The lateral clavicle articulates with which process?',
        bullets: ['Acromion', 'Coracoid', 'Spine of scapula'],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:deltoid',
    shortId: 'VM-SHO-R-MUS-DELT',
    name: 'Deltoid',
    latinName: 'Musculus deltoideus dexter',
    category: 'muscle',
    system: 'muscles',
    region: 'Lateral shoulder',
    laterality: 'right',
    color: '#d96357',
    synonyms: [
      'deltoid muscle',
      'anterior deltoid',
      'middle deltoid',
      'posterior deltoid',
    ],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Overview',
        body: 'A multipennate muscle forming the rounded contour of the shoulder.',
        bullets: [
          'Origin: lateral clavicle, acromion and scapular spine',
          'Insertion: deltoid tuberosity',
          'Innervation: axillary nerve (C5–C6)',
        ],
      },
      function: {
        title: 'Action',
        body: 'The middle fibres abduct the arm; anterior and posterior fibres assist flexion/internal rotation and extension/external rotation respectively.',
      },
      ct: {
        title: 'CT appearance',
        body: 'Muscle bulk and attenuation are compared with adjacent soft tissues and the contralateral side where available.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'Normal fibres show intermediate signal with thin internal fat planes. Oedema, tear or denervation changes alter signal and bulk.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound appearance',
        body: 'A fibrillar echotexture overlies the subacromial-subdeltoid bursa and cuff.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Deltoid injury is less common than cuff disease; atrophy may follow axillary neuropathy or disuse.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Test abduction with attention to pain, strength and axillary nerve sensory change over the lateral shoulder.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Which nerve supplies the deltoid?',
        bullets: [
          'Axillary nerve',
          'Musculocutaneous nerve',
          'Suprascapular nerve',
        ],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus',
    shortId: 'VM-SHO-R-MUS-SSP',
    name: 'Supraspinatus',
    latinName: 'Musculus supraspinatus dexter',
    category: 'muscle',
    system: 'muscles',
    region: 'Rotator cuff',
    laterality: 'right',
    color: '#ef897c',
    synonyms: ['supraspinatus tendon', 'superior rotator cuff'],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Overview',
        body: 'Occupies the supraspinous fossa and passes beneath the acromion to the superior facet of the greater tuberosity.',
        bullets: [
          'Origin: supraspinous fossa',
          'Insertion: greater tuberosity',
          'Innervation: suprascapular nerve (C5–C6)',
        ],
      },
      function: {
        title: 'Action',
        body: 'Initiates abduction and contributes to compression and centring of the humeral head.',
      },
      ct: {
        title: 'CT appearance',
        body: 'CT can show muscle volume, fatty change and mineralisation; tendon detail is limited unless arthrography is used.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'The tendon should remain low signal and continuous to its footprint. Evaluate tear dimensions, retraction and muscle quality.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound appearance',
        body: 'The tendon is assessed in long and short axes over the superior humeral head with dynamic impingement views.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Tendinopathy and partial- or full-thickness tears commonly involve the anterior distal tendon.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Painful resisted abduction may support cuff pathology but must be interpreted with the full examination and imaging.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Where does supraspinatus insert?',
        bullets: [
          'Greater tuberosity',
          'Lesser tuberosity',
          'Deltoid tuberosity',
        ],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:infraspinatus',
    shortId: 'VM-SHO-R-MUS-ISP',
    name: 'Infraspinatus',
    latinName: 'Musculus infraspinatus dexter',
    category: 'muscle',
    system: 'muscles',
    region: 'Posterior rotator cuff',
    laterality: 'right',
    color: '#be4f49',
    synonyms: ['infraspinatus tendon', 'posterior cuff'],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Overview',
        body: 'Arises from the infraspinous fossa and inserts on the middle facet of the greater tuberosity.',
        bullets: [
          'Innervation: suprascapular nerve',
          'Deep to posterior deltoid',
          'Blends with the posterior cuff capsule',
        ],
      },
      function: {
        title: 'Action',
        body: 'Externally rotates the humerus and helps stabilise the glenohumeral joint.',
      },
      ct: {
        title: 'CT appearance',
        body: 'Assess bulk, fatty replacement and osseous attachment sites.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'Evaluate tendon continuity, muscle oedema and fatty atrophy.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound appearance',
        body: 'Posterior scanning demonstrates the tendon inserting behind supraspinatus.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Tears, tendinopathy and denervation can produce weakness of external rotation.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Resisted external rotation and lag tests contribute to assessment.',
      },
      quiz: {
        title: 'Quick check',
        body: 'What is the principal action of infraspinatus?',
        bullets: ['External rotation', 'Internal rotation', 'Elbow flexion'],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',
    shortId: 'VM-SHO-R-MUS-SUBS',
    name: 'Subscapularis',
    latinName: 'Musculus subscapularis dexter',
    category: 'muscle',
    system: 'muscles',
    region: 'Anterior rotator cuff',
    laterality: 'right',
    color: '#a9423e',
    synonyms: ['subscapularis tendon', 'anterior cuff'],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Overview',
        body: 'Arises from the subscapular fossa and inserts on the lesser tuberosity.',
        bullets: [
          'Largest cuff muscle',
          'Innervation: upper and lower subscapular nerves',
          'Closely related to the biceps pulley',
        ],
      },
      function: {
        title: 'Action',
        body: 'Internally rotates and adducts the humerus while contributing to anterior stability.',
      },
      ct: {
        title: 'CT appearance',
        body: 'Assess muscle bulk, fat and the lesser-tuberosity insertion.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'Axial and sagittal-oblique images demonstrate the tendon, biceps pulley and muscle quality.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound appearance',
        body: 'Dynamic external rotation brings the tendon into view at the lesser tuberosity.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Upper-border tears may be associated with long-head biceps instability.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Lift-off, belly-press and bear-hug tests can assess function in context.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Where does subscapularis insert?',
        bullets: ['Lesser tuberosity', 'Greater tuberosity', 'Acromion'],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:biceps-long-head',
    shortId: 'VM-SHO-R-MUS-LHB',
    name: 'Biceps · long head',
    latinName: 'Caput longum musculi bicipitis brachii',
    category: 'muscle',
    system: 'soft-tissue',
    region: 'Anterior shoulder and arm',
    laterality: 'right',
    color: '#b55b55',
    synonyms: ['LHB', 'biceps tendon', 'bicipital tendon'],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Long head and proximal tendon',
        body: 'The long head begins at the superior glenoid region, crosses the joint and descends through the intertubercular groove before joining the muscle belly in the arm.',
        bullets: [
          'Proximal tendon and muscle are one source mesh',
          'Muscle innervation: musculocutaneous nerve',
          'Distal biceps insertion: radial tuberosity and bicipital aponeurosis',
        ],
        note: 'The mesh is not a separately segmented tendon. The lower arm is cropped from this view.',
      },
      function: {
        title: 'Mechanical role',
        body: 'Contributes to elbow flexion and supination through the biceps complex; its shoulder stabilising role is context dependent.',
      },
      ct: {
        title: 'CT appearance',
        body: 'The tendon may be visible as a soft-tissue structure in the groove; CT arthrography can improve joint assessment.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI appearance',
        body: 'A low-signal round or ovoid tendon should remain centred in the groove; assess the anchor and pulley.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound appearance',
        body: 'Short-axis imaging shows an echogenic fibrillar tendon within the groove; dynamic assessment can test stability.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Common patterns',
        body: 'Tendinopathy, tear and subluxation may accompany cuff or pulley injury.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Anterior shoulder pain is nonspecific; correlate examination, imaging and coexisting cuff disease.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Where is the long-head biceps tendon normally centred?',
        bullets: [
          'Intertubercular groove',
          'Spinoglenoid notch',
          'Subacromial bursa',
        ],
      },
    },
  },
  {
    id: 'vm:anatomy:upper-limb:shoulder:right:muscle:teres-minor',
    shortId: 'VM-SHO-R-MUS-TMIN',
    name: 'Teres minor',
    latinName: 'Musculus teres minor dexter',
    category: 'muscle',
    system: 'muscles',
    region: 'Posterior rotator cuff',
    laterality: 'right',
    color: '#a94b48',
    synonyms: ['small round muscle', 'inferior posterior cuff'],
    sections: {
      xray: pendingXrayLesson(),
      anatomy: {
        title: 'Posterior cuff',
        body: 'This narrow cuff muscle lies along the lateral scapula, below infraspinatus and above teres major.',
        bullets: [
          'Scapular origin near the lateral border',
          'Humeral insertion at the inferior greater-tubercle facet',
          'Axillary nerve supply (C5–C6)',
        ],
      },
      function: {
        title: 'Action',
        body: 'Assists external rotation of the arm and stabilisation of the humeral head.',
      },
      ct: {
        title: 'CT assessment',
        body: 'Review muscle size and fatty replacement on soft-tissue windows.',
        note: sharedImagingNote,
      },
      mri: {
        title: 'MRI assessment',
        body: 'Review the muscle belly and posterior cuff tendon for signal change, loss of bulk and fatty replacement.',
        note: sharedImagingNote,
      },
      ultrasound: {
        title: 'Ultrasound assessment',
        body: 'Posterior views may show the inferior cuff attachment; reliable identification requires local landmarks and trained technique.',
        note: sharedImagingNote,
      },
      pathology: {
        title: 'Patterns to review',
        body: 'Teres minor may be affected by cuff injury or denervation. Imaging findings require clinical correlation.',
      },
      clinical: {
        title: 'Clinical relevance',
        body: 'Consider its contribution when assessing external-rotation weakness. No isolated examination finding establishes a diagnosis.',
      },
      quiz: {
        title: 'Quick check',
        body: 'Which nerve supplies teres minor?',
        bullets: [
          'Axillary nerve',
          'Suprascapular nerve',
          'Long thoracic nerve',
        ],
      },
    },
  },
];

const sourceMappings: Record<string, string[]> = {
  scapula: ['FMA13395'],
  humerus: ['FMA23130'],
  clavicle: ['FMA13322'],
  supraspinatus: ['FMA32544'],
  infraspinatus: ['FMA32547'],
  subscapularis: ['FMA13414'],
  'teres-minor': ['FMA32553'],
  deltoid: ['FMA34680', 'FMA34682', 'FMA34684'],
  'biceps-long-head': ['FMA37686'],
};
for (const structure of structures)
  structure.sourceFmaIds = sourceMappings[structure.id.split(':').at(-1)!];

export const structureById = new Map(
  structures.map((structure) => [structure.id, structure]),
);

export const systemMeta: Record<
  SystemKey,
  { name: string; description: string; color: string }
> = {
  skeleton: {
    name: 'Skeleton',
    description: '3 structures',
    color: '#c6b798',
  },
  muscles: {
    name: 'Shoulder muscles',
    description: 'Cuff + deltoid',
    color: '#dc6a5f',
  },
  'soft-tissue': {
    name: 'Biceps complex',
    description: 'Long head + tendon',
    color: '#b55b55',
  },
};

export const quizQuestions = [
  {
    prompt: 'Select the muscle that initiates abduction.',
    answer: 'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus',
    options: [
      'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus',
      'vm:anatomy:upper-limb:shoulder:right:muscle:infraspinatus',
      'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',
    ],
  },
  {
    prompt: 'Identify the anterior rotator-cuff muscle.',
    answer: 'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',
    options: [
      'vm:anatomy:upper-limb:shoulder:right:muscle:deltoid',
      'vm:anatomy:upper-limb:shoulder:right:muscle:subscapularis',
      'vm:anatomy:upper-limb:shoulder:right:muscle:infraspinatus',
    ],
  },
  {
    prompt: 'Which structure contains the glenoid fossa?',
    answer: 'vm:anatomy:upper-limb:shoulder:right:bone:scapula',
    options: [
      'vm:anatomy:upper-limb:shoulder:right:bone:clavicle',
      'vm:anatomy:upper-limb:shoulder:right:bone:humerus',
      'vm:anatomy:upper-limb:shoulder:right:bone:scapula',
    ],
  },
];
