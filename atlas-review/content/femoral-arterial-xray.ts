// Independently written factual orientation. Reading references confer no media rights.
const lowerLimbAnatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/';
const catheterAngiography='https://www.radiologyinfo.org/en/info/angiocath';
const femoralVariation='https://pubmed.ncbi.nlm.nih.gov/24590524/';
const femoralAngiography='https://pubmed.ncbi.nlm.nih.gov/27566991/';
const circumflexVariation='https://pubmed.ncbi.nlm.nih.gov/19085859/';
const descendingAngiograms='https://pubmed.ncbi.nlm.nih.gov/18176215/';

export const femoralArterialXrayTopics={
  'femoral-artery':{
    title:'Femoral arterial angiographic orientation',
    body:'On an acquired contrast catheter angiogram of the thigh, orient the femoral arterial course from the demonstrated proximal vessel toward the distal thigh. The deep femoral branch is a useful proximal landmark when its origin is shown; confirm the branch on the images rather than assuming it from a projected crossing.',
    bullets:[
      'Anatomical naming distinguishes the common femoral segment before the deep femoral origin from the continuing superficial femoral segment. A femoral angiography cohort documented variation in bifurcation level; the retained bilateral source cannot locate that naming boundary exactly.',
      'Trace each opacified side independently. A bilateral reference surface does not establish matching branching, uninterrupted contrast filling, vessel calibre or a diagnosis.',
    ],
    citations:[lowerLimbAnatomy,catheterAngiography,femoralVariation,femoralAngiography],
  },
  'deep-femoral-artery':{
    title:'Deep femoral angiographic orientation',
    body:'On an acquired contrast catheter study that includes its origin, identify the deep femoral artery (profunda femoris) as a branch from the femoral artery in the proximal thigh. Follow the opacified branch separately from the femoral continuation before assigning names to smaller branches.',
    bullets:[
      'Cadaveric studies document variation in the profunda origin and in whether the lateral circumflex femoral artery arises from profunda or directly from femoral artery. The usual branching pattern is a guide, not proof of this source anatomy.',
      'The retained deep femoral selection includes a lateral circumflex parent that is not separately selectable. Selection alone cannot resolve that parent’s origin or verify any small branch junction on angiography.',
    ],
    citations:[lowerLimbAnatomy,catheterAngiography,femoralVariation,circumflexVariation],
  },
  'descending-lateral-circumflex-femoral-artery':{
    title:'Descending lateral circumflex angiographic orientation',
    body:'When an acquired contrast catheter examination demonstrates the descending branch of the lateral circumflex femoral artery, orient it as a branch coursing toward the distal anterolateral thigh. Name the parent vessel only where an opacified junction can actually be followed.',
    bullets:[
      'Original anatomical observations include separate origins of lateral circumflex ascending and descending branches. An expected lateral circumflex parent cannot be imposed on every branching pattern.',
      'The supplied descending segment is separate from the grouped profunda source, with no verified junction or continuous lumen between them. Its reference surface does not establish connection, patency, perfusion or measured calibre.',
    ],
    citations:[lowerLimbAnatomy,catheterAngiography,circumflexVariation,descendingAngiograms],
  },
} as const;
