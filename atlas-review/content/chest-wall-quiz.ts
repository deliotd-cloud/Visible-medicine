// Original formative questions; references support facts, not source-model validation.
const muscles='https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html';
const breathing='https://www.nhlbi.nih.gov/health/lungs/breathing-benefits';
export const chestWallQuizQuestions={
  external:{
    body:'Which statement best describes external-intercostal respiratory action?',
    choices:['It is identical in every part of every space','It has no relationship to rib mechanics','It can assist inspiration, but its mechanical effect varies with location','It directly opens the vocal folds'],
    correctAnswer:'It can assist inspiration, but its mechanical effect varies with location',
    explanation:'Human mechanical studies show regional variation rather than one uniform action. The bilateral grouped source cannot assign a measured respiratory effect to each slip or simulate movement.',
    references:['https://pmc.ncbi.nlm.nih.gov/articles/PMC2278403/'],
  },
  internal:{
    body:'Which layer lies between the external and innermost intercostal muscles?',
    choices:['Visceral pleura','Diaphragm','Internal intercostal muscles','Transversus abdominis'],
    correctAnswer:'Internal intercostal muscles',
    explanation:'Internal intercostals form the intermediate muscular layer. The displayed group does not validate an individual space, fibre subdivision or dissection plane.',
    references:[muscles],
  },
  innermost:{
    body:'The main intercostal neurovascular bundle usually lies between which muscular layers?',
    choices:['External and internal intercostals','Internal and innermost intercostals','Diaphragm and transversus abdominis','Pectoralis major and minor'],
    correctAnswer:'Internal and innermost intercostals',
    explanation:'Innermost intercostals lie deep to that bundle. No intercostal nerve or safe procedural route is established by the highlighted mesh.',
    references:[muscles],
  },
  transversus:{
    body:'Which attachment pair best describes transversus thoracis?',
    choices:['Clavicle and humerus','Scapula and upper ribs','Thoracic vertebrae and lumbar fascia','Posterior sternum and inner costal cartilages'],
    correctAnswer:'Posterior sternum and inner costal cartilages',
    explanation:'This deep anterior chest-wall muscle links the sternum region with costal cartilages. A named side does not prove complete attachment boundaries.',
    references:[muscles],
  },
  diaphragm:{
    body:'What usually happens when the diaphragm contracts during quiet inspiration?',
    choices:['It ascends and decreases chest volume','It descends and increases chest volume','It closes the trachea','It pumps blood into the aorta'],
    correctAnswer:'It descends and increases chest volume',
    explanation:'Descent enlarges the thoracic cavity as the lungs expand. The static reference surface does not demonstrate excursion, weakness or paralysis; those require separate clinical assessment.',
    references:[breathing],
  },
} as const;
export type ChestWallQuizGroup=keyof typeof chestWallQuizQuestions;
