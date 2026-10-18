// Original questions about factual relationships; no publisher prose/media reused.
const upper = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const lower = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
export type LimbNerveQuizGroup = 'superficialis' | 'profundus' | 'ulnaris' | 'supinator'
  | 'adductor' | 'sartorius' | 'posterior' | 'anterior';
type Question = {body:string; choices:string[]; correctAnswer:string; explanation:string; references:string[]};
export const limbNerveQuizQuestions: Record<LimbNerveQuizGroup, Question> = {
  superficialis: {
    body:'Which nerve usually supplies flexor digitorum superficialis?',
    choices:['Radial nerve','Median nerve','Ulnar nerve','Axillary nerve'],
    correctAnswer:'Median nerve', explanation:'Its usual motor supply is median.', references:[upper],
  },
  profundus: {
    body:'Which usual supply pattern fits flexor digitorum profundus?',
    choices:['Ulnar throughout','Radial throughout','Median throughout','Median: digits 2–3; ulnar: digits 4–5'],
    correctAnswer:'Median: digits 2–3; ulnar: digits 4–5',
    explanation:'The radial half is median-supplied; the ulnar half is ulnar-supplied. Do not assume uniform supply.', references:[upper],
  },
  ulnaris: {
    body:'Which nerve usually supplies flexor carpi ulnaris?',
    choices:['Ulnar nerve','Musculocutaneous nerve','Median nerve','Radial nerve'],
    correctAnswer:'Ulnar nerve', explanation:'The usual muscle-level supply is ulnar, not median.', references:[upper],
  },
  supinator: {
    body:'Which radial nerve division usually supplies supinator?',
    choices:['Superficial branch','Posterior cutaneous branch','Deep branch of radial nerve','No radial supply'],
    correctAnswer:'Deep branch of radial nerve', explanation:'The motor relationship is with the deep branch.', references:[upper],
  },
  adductor: {
    body:'Which nerve usually supplies adductor longus?',
    choices:['Femoral nerve','Obturator nerve','Nerve to obturator internus','Superior gluteal nerve'],
    correctAnswer:'Obturator nerve', explanation:'Obturator supply must not be confused with the nerve to obturator internus.', references:[lower],
  },
  sartorius: {
    body:'Which nerve usually supplies sartorius?',
    choices:['Obturator nerve','Tibial nerve','Inferior gluteal nerve','Femoral nerve'],
    correctAnswer:'Femoral nerve', explanation:'Sartorius has usual femoral motor supply.', references:[lower],
  },
  posterior: {
    body:'Which nerve usually supplies tibialis posterior?',
    choices:['Tibial nerve','Deep fibular nerve','Superficial fibular nerve','Femoral nerve'],
    correctAnswer:'Tibial nerve', explanation:'Its usual supply is tibial, unlike tibialis anterior.', references:[lower],
  },
  anterior: {
    body:'Which branch usually supplies tibialis anterior?',
    choices:['Tibial nerve','Superficial fibular nerve','Deep fibular nerve','Obturator nerve'],
    correctAnswer:'Deep fibular nerve', explanation:'Identify the deep fibular branch, not its whole parent nerve.', references:[lower],
  },
};
