// Original formative questions; references support anatomy, not source-model validation.
const glutealTable='https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html';
const thighTable='https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html';

export const thighMuscleQuizQuestions={
  gluteusMaximus:{
    body:'Which nerve supplies gluteus maximus?',
    choices:['Femoral nerve','Inferior gluteal nerve','Superior gluteal nerve','Obturator nerve'],
    correctAnswer:'Inferior gluteal nerve',
    explanation:'Gluteus maximus receives the inferior gluteal nerve. A selected surface cannot show its nerve fibres.',
    references:[glutealTable],
  },
  gluteusMediusMinimus:{
    body:'Which nerve supplies gluteus medius and minimus?',
    choices:['Superior gluteal nerve','Inferior gluteal nerve','Femoral nerve','Tibial nerve'],
    correctAnswer:'Superior gluteal nerve',
    explanation:'Both receive the superior gluteal nerve; highlighting either muscle does not depict that nerve.',
    references:[glutealTable],
  },
  rectusFemoris:{
    body:'Which paired actions fit rectus femoris?',
    choices:['Flexes knee and extends hip','Extends hip and knee','Flexes hip and extends knee','Flexes hip and knee'],
    correctAnswer:'Flexes hip and extends knee',
    explanation:'Rectus femoris flexes the hip and extends the knee. This static model does not demonstrate motion.',
    references:[thighTable],
  },
  vasti:{
    body:'What is the shared knee action of the vasti?',
    choices:['Flexion','Rotation only','Abduction','Extension'],
    correctAnswer:'Extension',
    explanation:'The vasti extend the knee and receive femoral innervation; the surface does not measure force.',
    references:[thighTable],
  },
  bicepsLong:{
    body:'Which sciatic division supplies the long head of biceps femoris?',
    choices:['Common fibular','Femoral','Tibial','Obturator'],
    correctAnswer:'Tibial',
    explanation:'The long head receives the tibial division of the sciatic nerve. The model shows a muscle selection, not its nerve.',
    references:[glutealTable],
  },
  bicepsShort:{
    body:'Which sciatic division supplies the short head of biceps femoris?',
    choices:['Common fibular','Tibial','Femoral','Obturator'],
    correctAnswer:'Common fibular',
    explanation:'The short head receives the common fibular division of the sciatic nerve; the nerve is not established by this surface.',
    references:[glutealTable],
  },
  semis:{
    body:'What actions do semitendinosus and semimembranosus share?',
    choices:['Extend knee and flex hip','Flex hip and knee','Extend hip and knee','Extend hip and flex knee'],
    correctAnswer:'Extend hip and flex knee',
    explanation:'Both extend the hip and flex the knee. A static selection does not demonstrate either movement.',
    references:[glutealTable],
  },
} as const;
export type ThighMuscleQuizGroup=keyof typeof thighMuscleQuizQuestions;
