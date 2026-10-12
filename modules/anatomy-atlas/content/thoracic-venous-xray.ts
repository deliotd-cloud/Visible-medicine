// Original factual teaching. References are reading links, not reusable assets.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';
const coronaryStudy = 'https://pubmed.ncbi.nlm.nih.gov/9825333/';
const anteriorStudy = 'https://pubmed.ncbi.nlm.nih.gov/1163193/';
const hemiazygosStudy = 'https://pubmed.ncbi.nlm.nih.gov/6406316/';
const catheterCase = 'https://qims.amegroups.org/article/view/115406/html';

export const thoracicVenousXrayTopics = {
  'anterior-cardiac-vein': {
    title: 'Anterior cardiac venous drainage and projection',
    body: 'Anterior cardiac veins drain the anterior right ventricular surface into the right atrium, rather than through the coronary sinus. This source-defined group is distinct from the anterior interventricular segment of the great cardiac vein.',
    bullets: [
      'An original morphological study described variable courses and right atrial openings, including common drainage channels. The two retained source surfaces are not a normal vein count, two named tributaries or verified atrial openings.',
      'A coronary-sinus venogram cannot be assumed to opacify this separate drainage pathway. A projected line or apparent contact with the right coronary artery does not establish its identity, continuity or a catheter route.',
    ],
    citations: [anatomy, anteriorStudy],
  },
  'great-cardiac-vein': {
    title: 'Great cardiac vein in the coronary venous phase',
    body: 'The great cardiac vein accompanies the anterior interventricular artery before reaching the coronary-sinus pathway. In contrast venous-phase images, distinguish the vein from the adjacent artery by the demonstrated course and timing of opacification, not by screen position alone.',
    bullets: [
      'A study of 100 coronary angiograms assessed veins after left coronary arterial contrast injection in several projections. Great and middle cardiac veins were consistently identified in that study; this is not a guarantee of visibility on every examination or an ordinary chest radiograph.',
      'A contrast-filled lumen in an acquired study is not reproduced by this external surface. It does not supply validated stenosis measurements, a complete tributary tree or a pacing-lead route.',
    ],
    citations: [anatomy, coronaryStudy],
  },
  'middle-cardiac-vein': {
    title: 'Middle cardiac vein in the coronary venous phase',
    body: 'The middle cardiac vein runs near the posterior interventricular artery and drains to the coronary sinus. Locate it using the demonstrated venous course and projection; it is not the posterior interventricular artery or the posterior vein of the left ventricle.',
    bullets: [
      'The coronary angiographic study used more than one projection to assess venous anatomy. A venous-phase contrast image and a plain chest radiograph answer different questions; the study does not establish routine normal visibility without contrast.',
      'The retained selection contains 14 source components, not 14 independently named veins. Separation in an exploded view or surface proximity cannot establish a continuous lumen, a coronary-sinus opening or a safe catheter route.',
    ],
    citations: [anatomy, coronaryStudy],
  },
  'hemiazygos-vein': {
    title: 'Hemiazygos system on chest radiographs',
    body: 'The hemiazygos vein collects lower left thoracic drainage into the azygos pathway. A primary case report described enlarged hemiazygos-system and superior-intercostal collaterals on frontal and lateral chest radiographs in caval obstruction. This is pathological enlargement, not routine visibility of a normal hemiazygos vein.',
    bullets: [
      'The report concerns a venous system, not an isolated mesh: a paraspinal or mediastinal opacity cannot be assigned solely to this selection, and the case report does not establish a diagnostic threshold or specificity.',
      'The source classification remains midline for the crossing vessel; it is not relabelled as accessory hemiazygos. The usual lower-left course does not certify the crossing level, collateral connections or drainage pattern in a patient.',
    ],
    citations: [anatomy, hemiazygosStudy],
  },
  'right-internal-thoracic-vein': {
    title: 'Internal thoracic vein and catheter projection',
    body: 'The internal thoracic vein lies behind the anterior chest wall and drains towards the brachiocephalic venous system. Its right-sided projection can overlap the superior vena cava region on a frontal radiograph, creating a pitfall when interpreting a catheter course.',
    bullets: [
      'A published right internal thoracic catheter-malposition case illustrates a seemingly plausible frontal projection with an anterior retrosternal course on the lateral view; CT confirmed the actual vein. A catheter line is not a direct outline of the unopacified venous lumen.',
      'The case does not provide a normal vein visibility rate or prove that a projected catheter is safely placed. Full acquired-study assessment is required; this atlas does not certify tip position, prescribe contrast injection or guide catheter manipulation.',
    ],
    citations: [catheterCase],
  },
} as const;
