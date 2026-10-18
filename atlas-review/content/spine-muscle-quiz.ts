// Original formative wording about usual anatomy, not validation of these source meshes.
const back = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html';
const thorax = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html';
const iliocostalis = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/ili.htm';
const spinalis = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/spin.htm';
const spleniusCervicis = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/spce.htm';
const interspinalis = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/ints.htm';
const intertransversarii = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/intt.htm';
const obliquusInferior = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/obci.htm';
const obliquusSuperior = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/obcs.htm';
const rectusMajor = 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/mml/rpmj.htm';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const spineMuscleQuizQuestions = {
  rotatores: question('Where do rotatores attach above their transverse-process origin?',
    ['A higher spinous process', 'A lower transverse process', 'An adjacent lamina only', 'A rib angle'],
    'A higher spinous process', 'Rotatores reach higher spinous processes.', back),
  iliocostalis: question('Across its named parts, which skeletal structures receive iliocostalis fibers?',
    ['Ribs and cervical transverse processes', 'Only spinous processes', 'Mastoid process and mandible', 'Sacrum and femur'],
    'Ribs and cervical transverse processes', 'The iliocostalis column has costal and cervical attachments.', iliocostalis),
  longissimus: question('Where does longissimus lie within the erector spinae?',
    ['Lateral to iliocostalis', 'Between iliocostalis and spinalis', 'Deep to rotatores', 'Within the suboccipital triangle'],
    'Between iliocostalis and spinalis', 'Longissimus forms the intermediate column.', back),
  semispinalisCapitis: question('Where does semispinalis capitis attach?',
    ['Mastoid process', 'Rib angle', 'Back of the occipital bone', 'Atlas transverse process'],
    'Back of the occipital bone', 'It reaches the posterior skull between nuchal lines.', back),
  semispinalisSpinal: question('About how many vertebral levels do semispinalis cervicis and thoracis span?',
    ['One', 'Two', 'Four to six', 'Ten to twelve'],
    'Four to six', 'Their fibers reach higher spinous processes.', back),
  spinalis: question('Which processes chiefly anchor the spinalis erector spinae?',
    ['Transverse processes', 'Costal cartilages', 'Mastoid processes', 'Spinous processes'],
    'Spinous processes', 'Spinalis runs between spinous process attachments.', spinalis),
  spleniusCapitis: question('Which structure receives splenius capitis?',
    ['Mastoid process', 'First rib', 'Lumbar transverse process', 'Sacrum'],
    'Mastoid process', 'Capitis reaches the temporal mastoid region.', back),
  spleniusCervicis: question('Splenius cervicis ascends from the midline towards which region?',
    ['Thoracic ribs', 'Cervical vertebrae', 'Occipital bone', 'Lumbar fascia'],
    'Cervical vertebrae', 'Its fibers reach cervical transverse processes.', spleniusCervicis),
  lumbarIntertransversarii: question('What trunk movement can lumbar intertransversarii assist?',
    ['Lateral bending', 'Shoulder elevation', 'Hip extension', 'Rib depression'],
    'Lateral bending', 'This segmental muscle group assists side bending of the spine.', intertransversarii),
  cervicalIntertransversarii: question('What movement can cervical intertransversarii assist?',
    ['Rib elevation', 'Shoulder abduction', 'Lateral neck bending', 'Jaw opening'],
    'Lateral neck bending', 'The cervical sets assist side bending between vertebral levels.', intertransversarii),
  interspinales: question('Which processes do interspinales link?',
    ['Transverse processes', 'Spinous processes', 'Costal processes', 'Mastoid processes'],
    'Spinous processes', 'They bridge spinous processes of neighbouring vertebrae.', interspinalis),
  levatoresCostarumBreves: question('Which rib receives a short levator costarum from a vertebral transverse process?',
    ['The rib directly below', 'The rib two levels below', 'The rib above', 'No rib'],
    'The rib directly below', 'The short fibers reach the next rib near its angle.', thorax),
  obliquusCapitisInferior: question('Which bones does obliquus capitis inferior link?',
    ['Axis and atlas', 'Atlas and occiput', 'Axis and occiput', 'Two thoracic vertebrae'],
    'Axis and atlas', 'It runs from the axis towards the lateral atlas.', obliquusInferior),
  obliquusCapitisSuperior: question('From the atlas, where does obliquus capitis superior attach?',
    ['Axis spinous process', 'Mastoid process', 'Occipital bone', 'First rib'],
    'Occipital bone', 'It ascends from the atlas towards the inferior nuchal line.', obliquusSuperior),
  rectusCapitisPosteriorMajor: question('Which vertebra gives rise to rectus capitis posterior major?',
    ['Atlas', 'Axis', 'C7', 'T1'],
    'Axis', 'Its lower attachment is the axis spinous process.', rectusMajor),
  rectusCapitisPosteriorMinor: question('Which vertebral landmark anchors rectus capitis posterior minor?',
    ['Axis spinous process', 'C7 transverse process', 'Atlas posterior tubercle', 'Atlas anterior arch'],
    'Atlas posterior tubercle', 'The smaller rectus muscle ascends from the posterior atlas.', back),
} as const;
export type SpineMuscleQuizGroup = keyof typeof spineMuscleQuizQuestions;
