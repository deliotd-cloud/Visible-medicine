// Original formative drafts; a selected surface does not establish a complete airway.
const table='https://anatomy.ttuhscep.edu/schemes/larynx_tables.html';
const dissection='https://anatomy.ttuhscep.edu/nervous_system/deepneck_ans.html';
const michigan='https://sites.google.com/a/umich.edu/bluelink/curricula/anatomy-403/respiratory-system/respiratory-los';
const question=(body:string,choices:string[],correctAnswer:string,explanation:string,references:string[])=>({body,choices,correctAnswer,explanation,references});

export const laryngealFrameworkQuizQuestions={
  thyroid:question('Where do the thyroid cartilage laminae meet?',
    ['Anterior midline','Posterior midline','Cricoid lamina','Arytenoid apex'],
    'Anterior midline','Their anterior union forms the laryngeal prominence.',[table]),
  cricoid:question('Which feature distinguishes the cricoid cartilage?',
    ['An open posterior border','A complete cartilaginous ring','Two separate laminae','A free leaf-shaped tip'],
    'A complete cartilaginous ring','Its anterior arch and broader posterior lamina complete the ring.',[table]),
  arytenoid:question('Which arytenoid projection anchors the vocal ligament?',
    ['Apex','Muscular process','Vocal process','Posterior surface'],
    'Vocal process','The anteriorly directed vocal process provides this attachment.',[table]),
  corniculate:question('Where is a corniculate cartilage situated?',
    ['Below the cricoid','Inside the thyroid notch','Within the vocal ligament','On an arytenoid apex'],
    'On an arytenoid apex','These small paired cartilages cap the arytenoids.',[dissection]),
  cuneiform:question('Which fold contains the cuneiform cartilage?',
    ['Aryepiglottic fold','Vocal fold','Vestibular fold','Glossoepiglottic fold'],
    'Aryepiglottic fold','The cuneiform is embedded in the fold at the laryngeal inlet.',[dissection]),
  epiglottis:question('Which outline describes the epiglottic cartilage?',
    ['Complete ring','Leaf with a stalk','Paired pyramids','Two broad laminae'],
    'Leaf with a stalk','This mobile cartilage participates in swallowing; a static surface cannot demonstrate airway protection.',[michigan]),
  medianThyrohyoid:question('Which thyroid landmark is connected to the hyoid by the median thyrohyoid ligament?',
    ['Inferior horn','Oblique line','Superior thyroid notch','Inferior border'],
    'Superior thyroid notch','The median ligament reinforces the central thyrohyoid connection.',[table]),
  lateralThyrohyoid:question('Which thyroid projection attaches to the lateral thyrohyoid ligament?',
    ['Inferior horn','Laryngeal prominence','Oblique line','Superior horn'],
    'Superior horn','The ligament links this horn with the greater hyoid horn.',[table]),
  hyoepiglottic:question('The hyoepiglottic ligament links the epiglottis to which structure?',
    ['Hyoid','Cricoid','Arytenoid','Trachea'],
    'Hyoid','This anterior attachment differs from the separate thyroid connection.',[dissection]),
  thyroepiglottic:question('Which cartilage receives the thyroepiglottic ligament?',
    ['Cricoid','Thyroid','Corniculate','Arytenoid'],
    'Thyroid','It connects the tapered epiglottic attachment to the thyroid cartilage.',[dissection]),
  medianCricothyroid:question('The median cricothyroid ligament is continuous with which elastic sheet?',
    ['Thyrohyoid membrane','Quadrangular membrane','Conus elasticus','Buccopharyngeal fascia'],
    'Conus elasticus','It is the anterior midline portion; the mesh does not teach a clinical airway procedure.',[michigan]),
  vocal:question('Which free margin forms the vocal ligament?',
    ['Lower quadrangular margin','Upper thyrohyoid margin','Lower cricotracheal margin','Upper conus elasticus margin'],
    'Upper conus elasticus margin','The vocal ligament lies within the vocal fold; it is not the entire fold.',[michigan]),
  thyrohyoidMembrane:question('What does the thyrohyoid membrane connect?',
    ['Hyoid and thyroid cartilage','Thyroid and cricoid cartilages','Cricoid and trachea','Arytenoid and epiglottis'],
    'Hyoid and thyroid cartilage','It suspends the larynx from the hyoid. Source-side subdivisions do not imply two separate anatomical membranes.',[dissection]),
} as const;
export type LaryngealFrameworkQuizGroup=keyof typeof laryngealFrameworkQuizQuestions;
