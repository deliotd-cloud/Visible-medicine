// Original formative questions; references support anatomy, not source-model validation.
const lowerLimbTable='https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html';
const lowerLegBones='https://openstax.org/books/anatomy-and-physiology/pages/8-4-bones-of-the-lower-limb';
const legTable='https://anatomy.ttuhscep.edu/musculoskeletal_system/leg_tables.html';
const superficialLimbs='https://anatomy.ttuhscep.edu/musculoskeletal_system/superficial_limbs_tables.html';

export const lowerLimbConnectiveQuizQuestions={
  achilles:{
    body:'Which calf muscles transmit force through the calcaneal (Achilles) tendon to help plantarflex the foot?',
    choices:['Tibialis anterior and extensor digitorum longus','Gastrocnemius and soleus','Fibularis longus and fibularis brevis','Popliteus and sartorius'],
    correctAnswer:'Gastrocnemius and soleus',
    explanation:'Gastrocnemius and soleus contribute to the calcaneal tendon, which attaches to the calcaneus. The static tendon selection does not measure force or prove every fibre boundary.',
    references:[lowerLimbTable],
  },
  membrane:{
    body:'The interosseous membrane of the leg connects which two bones?',
    choices:['Femur and patella','Tibia and fibula','Talus and calcaneus','Tibia and femur'],
    correctAnswer:'Tibia and fibula',
    explanation:'The membrane spans between the tibia and fibula. A highlighted surface does not validate its full extent or individual fibre bundles.',
    references:[lowerLegBones],
  },
  plantar:{
    body:'Which foot arch does the long plantar ligament help support?',
    choices:['Lateral longitudinal arch','Transverse arch alone','Medial longitudinal arch alone','No foot arch'],
    correctAnswer:'Lateral longitudinal arch',
    explanation:'The long plantar ligament contributes to support of the lateral longitudinal arch alongside other structures; the displayed ligament does not demonstrate load-bearing mechanics.',
    references:[legTable],
  },
  iliotibial:{
    body:'The iliotibial tract is a thickened part of which tissue along the lateral thigh?',
    choices:['Periosteum of the femur','Fascia lata','Synovial lining of the knee','Deep fascia of the calf'],
    correctAnswer:'Fascia lata',
    explanation:'The iliotibial tract is a lateral thickening of the fascia lata. The selected surface does not validate every fascial attachment or show movement.',
    references:[superficialLimbs],
  },
} as const;
export type LowerLimbConnectiveQuizGroup=keyof typeof lowerLimbConnectiveQuizQuestions;
