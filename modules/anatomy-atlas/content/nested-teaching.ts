import type { NestedStudy } from '../lib/nested-anatomy';
import {
  cardiacTeaching,
  cardiacTeachingReferences,
} from './cardiac-teaching.ts';

export type NestedTopic = 'anatomy' | 'function' | 'clinical' | 'pathology';
export type NestedImagingTopic = 'ct' | 'mri' | 'ultrasound';
export type NestedSection = {
  body: string;
  references: string[];
  readiness: 'draft' | 'pending';
};
export type NestedConcept = {
  id: string;
  study: NestedStudy;
  fmaIds: string[];
  sections: Record<NestedTopic, NestedSection>;
  imaging?: Partial<Record<NestedImagingTopic, NestedSection>>;
  modelLimit: string;
  quiz: {
    question: string;
    answer: string;
    references: string[];
    basis: 'primary-reference' | 'model-scope';
  };
};
export const nestedTeachingReferences: Record<
  string,
  { title: string; url: string }
> = {
  ...cardiacTeachingReferences,
  hepaticArteries: {
    title: 'Texas Tech · Abdominal arteries',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  },
  hepaticVeins: {
    title: 'Texas Tech · Abdominal veins',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html',
  },
  hepaticDigestion: {
    title: 'NIDDK · The digestive system',
    url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
  },
  pulmonaryLobes: {
    title: 'NCI SEER · Lung anatomy',
    url: 'https://training.seer.cancer.gov/lung/anatomy/',
  },
  pulmonaryAirways: {
    title: 'NCI SEER · Bronchi, bronchial tree and lungs',
    url: 'https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html',
  },
  cardiacChambers: {
    title: 'NHLBI · Heart chambers and tissue',
    url: 'https://www.nhlbi.nih.gov/health/heart/anatomy',
  },
  cardiacFlow: {
    title: 'University of Minnesota · The human heart',
    url: 'https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml',
  },
  eyes: {
    title: 'NEI · How the eyes work',
    url: 'https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work',
  },
  cornea: {
    title: 'NEI · Corneal conditions',
    url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/corneal-conditions/other-types-corneal-disease',
  },
  cataract: {
    title: 'NEI · Cataracts and the eye',
    url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cataracts/cataracts-and-eye',
  },
  optics: {
    title: 'UTHealth · Eye and retina',
    url: 'https://nba.uth.tmc.edu/neuroscience/s2/chapter14.html',
  },
  marfan: {
    title: 'NIAMS · Marfan syndrome',
    url: 'https://www.niams.nih.gov/health-topics/marfan-syndrome',
  },
  vitreous: {
    title: 'NEI · Vitreous detachment',
    url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/vitreous-detachment',
  },
  uveitis: {
    title: 'NEI · Uveitis',
    url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/uveitis',
  },
  sclera: {
    title: 'NLM MeSH · Scleritis',
    url: 'https://meshb.nlm.nih.gov/record/ui?dcmsLinks=true&ui=D015423',
  },
  glaucoma: {
    title: 'NEI · Types of glaucoma',
    url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/types-glaucoma',
  },
  chamber: {
    title: 'NLM MeSH · Anterior chamber',
    url: 'https://meshb-prev.nlm.nih.gov/record/ui?ui=D000867',
  },
  ventricles: {
    title: 'UTHealth · Ventricular anatomy',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html',
  },
  hydrocephalus: {
    title: 'NINDS · Hydrocephalus',
    url: 'https://www.ninds.nih.gov/health-information/disorders/hydrocephalus',
  },
  brainstem: {
    title: 'UTHealth · Brainstem overview',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p29_index.html',
  },
  pathways: {
    title: 'UTHealth · Somatosensory clinical examples',
    url: 'https://nba.uth.tmc.edu/neuroscience/m/s2/chapter05.html',
  },
  pons: {
    title: 'UTHealth · Pontine cranial nerves',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p21_index.html',
  },
  brainstemVessels: {
    title: 'UTHealth · Brainstem blood supply',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L9/Lab09p33_index.html',
  },
  cerebellum: {
    title: 'NINDS · Cerebellar degeneration',
    url: 'https://www.ninds.nih.gov/health-information/disorders/cerebellar-degeneration',
  },
  lobes: {
    title: 'UTHealth · Lobes and sulci',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p06_index.html',
  },
  cortex: {
    title: 'UTHealth · Nervous system overview',
    url: 'https://nba.uth.tmc.edu/neuroscience/m/s2/chapter01.html',
  },
  temporal: {
    title: 'UTHealth · Temporal functional anatomy',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p17_index.html',
  },
  taste: {
    title: 'UTHealth · Central gustatory system',
    url: 'https://nba.uth.tmc.edu/neuroanatomy/L7/Lab07p22_index.html',
  },
  visual: {
    title: 'UTHealth · Cortical visual pathways',
    url: 'https://nba.uth.tmc.edu/neuroscience/s2/chapter15.html',
  },
  brain: {
    title: 'NINDS · Know your brain',
    url: 'https://www.ninds.nih.gov/es/node/8168',
  },
};
const section = (body: string, ...references: string[]) => ({
  body,
  references,
  readiness: 'draft' as const,
});
const pending = (body: string) => ({
  body,
  references: [],
  readiness: 'pending' as const,
});
const quiz = (
  question: string,
  answer: string,
  ...references: string[]
): NestedConcept['quiz'] => ({
  question,
  answer,
  references,
  basis: references.length ? 'primary-reference' : 'model-scope',
});

// Original, concise teaching drafts. These are conceptual lessons shared by
// explicitly pinned source representations, not patient-specific findings.
export const nestedConcepts: NestedConcept[] = [
  ...(
    [
      [
        'arterial',
        ['FMA14778', 'FMA14779'],
        'The right and left hepatic arteries usually arise from the proper hepatic artery. Branching variants occur.',
        'They supply liver tissue. The supplied meshes do not establish an individual perfusion territory.',
        'Which vessel usually divides into right and left hepatic arteries?',
        'The proper hepatic artery.',
        'hepaticArteries',
      ],
      [
        'portal',
        ['FMA15414', 'FMA15415'],
        'The portal vein divides into right and left branches before entering the liver.',
        'Portal blood reaches liver sinusoids from the digestive circulation; this is inflow, not hepatic venous outflow.',
        'Are portal and hepatic veins interchangeable labels?',
        'No. Portal branches carry blood into the liver; hepatic veins drain towards the inferior vena cava.',
        'hepaticVeins',
      ],
      [
        'biliary',
        ['FMA71857', 'FMA71858'],
        'Bile ducts transport bile made by the liver. Right and left source groups are shown separately.',
        'Bile contributes to fat digestion; this model does not simulate bile movement or duct patency.',
        'Does a coloured duct surface establish patency?',
        'No. A static source surface cannot establish whether a duct is open or obstructed.',
        'hepaticDigestion',
      ],
      [
        'venous-tributary',
        ['FMA15800'],
        'The middle hepatic vein receives segmental tributaries and drains into the inferior vena cava.',
        'Hepatic venous drainage carries blood away from liver tissue. This selected source group is only one named tributary.',
        'Is this two-component source group the entire middle hepatic vein?',
        'No. It is labelled as its anterior inferior segmental tributary.',
        'hepaticVeins',
      ],
    ] as const
  ).map(
    ([kind, ids, anatomy, fn, question, answer, ref]): NestedConcept => ({
      id: `hepatic-${kind}`,
      study: 'hepatic',
      fmaIds: [...ids],
      sections: {
        anatomy: section(anatomy, ref),
        function: section(fn, ref),
        clinical: pending(
          'Structure-specific clinical interpretation awaits specialist authoring and review.',
        ),
        pathology: pending(
          'No disease-specific lesson or pathological liver geometry has been supplied.',
        ),
      },
      modelLimit:
        'Original source branch groups only; no proven lumen continuity, complete drainage tree, Couinaud segment boundaries, surgical planes or scan registration. Liver tissue context retains unresolved source segment conflicts.',
      quiz:
        kind === 'biliary' || kind === 'venous-tributary'
          ? quiz(question, answer)
          : quiz(question, answer, ref),
    }),
  ),
  ...(
    [
      [
        'upper',
        ['FMA7333', 'FMA7370'],
        'Each lung has an upper lobe. The left lingula belongs to its upper lobe.',
        'Is the lingula a separate left middle lobe?',
        'No. It is part of the left upper lobe.',
      ],
      [
        'middle',
        ['FMA7383'],
        'The right lung has a middle lobe; the left lung has no middle lobe.',
        'Which lung has a middle lobe?',
        'The right lung.',
      ],
      [
        'lower',
        ['FMA7337', 'FMA7371'],
        'Both lungs have a lower lobe. The left has two lobes in total and the right has three.',
        'Does the left lung have a lower lobe?',
        'Yes. Its two lobes are upper and lower.',
      ],
    ] as const
  ).map(
    ([level, ids, anatomy, question, answer]): NestedConcept => ({
      id: `pulmonary-${level}-branches`,
      study: 'pulmonary',
      fmaIds: [...ids],
      sections: {
        anatomy: section(anatomy, 'pulmonaryLobes'),
        function: section(
          'Lobar bronchi conduct air into the lung. Gas exchange takes place in the distal alveolar region, which is not represented by these branch meshes.',
          'pulmonaryAirways',
        ),
        clinical: pending(
          'Lobe-specific imaging and clinical interpretation await authoring and specialist review. These branches are not a tissue segmentation.',
        ),
        pathology: pending(
          'No disease-specific lobe lesson or pathological lung geometry has been supplied.',
        ),
      },
      modelLimit:
        'Airway and vessel files grouped by source lobe membership only. No parenchymal envelope, fissure surface, alveoli, measured lung volume or patient-scan registration.',
      quiz: quiz(question, answer, 'pulmonaryLobes'),
    }),
  ),
  ...(
    [
      [
        'FMA11359',
        'right-atrium',
        'right atrium',
        'An atrium is a receiving chamber.',
        'Which chamber receives systemic venous return?',
        'The right atrium.',
      ],
      [
        'FMA9465',
        'left-atrium',
        'left atrium',
        'Blood returning from the lungs enters an atrium before passing to a ventricle.',
        'Which chamber receives pulmonary venous return?',
        'The left atrium.',
      ],
      [
        'FMA9291',
        'right-ventricle',
        'right ventricle',
        'Ventricles pump blood out of the heart.',
        'Which chamber pumps towards the pulmonary arteries?',
        'The right ventricle.',
      ],
      [
        'FMA9466',
        'left-ventricle',
        'left ventricle',
        'The ventricular pump supplies blood outside the heart.',
        'Which chamber pumps into the aorta?',
        'The left ventricle.',
      ],
    ] as const
  ).map(
    ([fma, id, chamber, functionText, question, answer]): NestedConcept => ({
      id: `cardiac-${id}`,
      study: 'cardiac',
      fmaIds: [fma],
      sections: {
        anatomy: section(
          `The ${chamber} is one of the four heart chambers. This model shows its cavity space, not surrounding muscle.`,
          'cardiacChambers',
        ),
        function: section(functionText, 'cardiacChambers'),
        clinical: cardiacTeaching[id].clinical,
        pathology: cardiacTeaching[id].pathology,
      },
      imaging: cardiacTeaching[id].imaging,
      modelLimit:
        'Static source cavity only; no cardiac-phase, volume, wall thickness, valve motion or registered scan. Atrial walls are optional nonselectable reference surfaces.',
      quiz: quiz(question, answer, 'cardiacFlow'),
    }),
  ),
  {
    id: 'eye-cornea',
    study: 'eye',
    fmaIds: ['FMA58239', 'FMA58240'],
    sections: {
      anatomy: section(
        'The transparent front of the globe lies in front of the iris and pupil, continuous with the outer coat at its margin.',
        'eyes',
      ),
      function: section(
        'Its curved surface refracts incoming light before the light reaches the lens.',
        'eyes',
      ),
      clinical: section(
        'Corneal transparency matters for vision. A clear-looking demonstration mesh cannot establish the health of a real cornea.',
        'eyes',
        'cornea',
      ),
      pathology: section(
        'Keratitis can damage and scar the cornea, reducing vision. The atlas does not show infection, ulcers or microscopic corneal layers.',
        'cornea',
      ),
    },
    modelLimit:
      'One source corneal surface; no separate epithelium, stroma or endothelium, and no measured optical power.',
    quiz: quiz(
      'Which transparent structure does incoming light meet before the lens?',
      'The cornea.',
      'eyes',
    ),
  },
  {
    id: 'eye-iris',
    study: 'eye',
    fmaIds: ['FMA58236', 'FMA58237'],
    sections: {
      anatomy: section(
        'The iris is the coloured diaphragm surrounding the pupil, anterior to the lens.',
        'eyes',
      ),
      function: section(
        'Changing pupil size regulates the light entering the eye.',
        'eyes',
      ),
      clinical: section(
        'The pupil is an opening, not another solid tissue layer. This view does not reproduce a pupil light reflex.',
        'eyes',
      ),
      pathology: section(
        'Anterior uveitis involves the iris. Pain, redness, light sensitivity or blurred vision require clinical assessment rather than interpretation from this model.',
        'uveitis',
      ),
    },
    modelLimit:
      'No separate sphincter/dilator muscles, innervation, dynamic pupil or iridocorneal-angle measurement.',
    quiz: quiz(
      'Is the pupil a tissue or an opening?',
      'An opening within the iris.',
      'eyes',
    ),
  },
  {
    id: 'eye-lens',
    study: 'eye',
    fmaIds: ['FMA58242', 'FMA58243'],
    sections: {
      anatomy: section(
        'The lens is a transparent internal structure behind the pupil and in front of the vitreous compartment.',
        'cataract',
        'optics',
      ),
      function: section(
        'It focuses light with the cornea; changing lens curvature supports near focusing.',
        'cataract',
        'optics',
      ),
      clinical: section(
        'Do not equate lens position, clarity and accommodation: they describe different aspects of ocular function.',
        'cataract',
        'optics',
      ),
      pathology: section(
        'A cataract is lens clouding. It is distinct from displacement of the lens and from retinal disease.',
        'cataract',
        'marfan',
      ),
    },
    modelLimit:
      'Single surface without separately validated capsule, cortex, nucleus or accommodative motion.',
    quiz: quiz(
      'Which tissue becomes cloudy in a cataract?',
      'The lens, not the cornea or retina.',
      'cataract',
    ),
  },
  {
    id: 'eye-zonule',
    study: 'eye',
    fmaIds: ['FMA58839', 'FMA58840'],
    sections: {
      anatomy: section(
        'The source-labelled suspensory ligament represents the support between the ciliary region and lens capsule.',
        'optics',
      ),
      function: section(
        'Zonular tension influences lens curvature. Ciliary contraction reduces that tension during near accommodation.',
        'optics',
      ),
      clinical: section(
        'Lens support and lens transparency are separate questions when examining vision problems.',
        'optics',
        'marfan',
      ),
      pathology: section(
        'Lens displacement is called ectopia lentis and can occur in Marfan syndrome. The model is not a test for that condition.',
        'marfan',
      ),
    },
    modelLimit:
      'Grouped support geometry, not individually segmented fibrils, insertion measurements or a biomechanical simulation.',
    quiz: quiz(
      'During near accommodation, does zonular tension rise or fall?',
      'It falls, allowing the lens to become more curved.',
      'optics',
    ),
  },
  {
    id: 'eye-vitreous',
    study: 'eye',
    fmaIds: ['FMA58828', 'FMA58829'],
    sections: {
      anatomy: section(
        'The vitreous is the gel-filled compartment behind the lens, contacting the inner retina.',
        'vitreous',
        'optics',
      ),
      function: section(
        'It is part of the transparent path through which light reaches the retina.',
        'optics',
      ),
      clinical: section(
        'New flashes or a sudden increase in floaters warrant prompt eye examination because retinal tears or detachment must be excluded.',
        'vitreous',
      ),
      pathology: section(
        'Vitreous detachment separates vitreous attachments from the retina; it is not synonymous with retinal detachment, although it can cause a tear.',
        'vitreous',
      ),
    },
    modelLimit:
      'Compartment surface only; retinal attachments, floaters, traction and retinal tears are not depicted.',
    quiz: quiz(
      'Are posterior vitreous detachment and retinal detachment the same?',
      'No. They involve different separations, although vitreous traction can damage the retina.',
      'vitreous',
    ),
  },
  {
    id: 'eye-choroid',
    study: 'eye',
    fmaIds: ['FMA58299', 'FMA58300'],
    sections: {
      anatomy: section(
        'The choroid belongs to the uvea and lies between the sclera and retina.',
        'uveitis',
      ),
      function: section(
        'Its pigment helps absorb light that passes beyond the retinal receptors, limiting internal scatter.',
        'optics',
      ),
      clinical: section(
        'Keep choroidal and retinal disease conceptually separate even though the tissues are closely related.',
        'uveitis',
      ),
      pathology: section(
        'Posterior uveitis can affect the choroid and retina. The coloured layer here is normal source geometry, not inflammatory enhancement.',
        'uveitis',
      ),
    },
    modelLimit:
      'Two source files form each named choroid. Retinal tissue, individual vessels and microscopic layers are not separately shown.',
    quiz: quiz(
      'Which outer coat lies superficial to the choroid?',
      'The sclera.',
      'uveitis',
    ),
  },
  {
    id: 'eye-sclera',
    study: 'eye',
    fmaIds: ['FMA58271', 'FMA58272'],
    sections: {
      anatomy: section(
        'The sclera is the white outer coat covering most of the globe.',
        'cataract',
      ),
      function: section(
        'It supports the globe and protects its contents.',
        'cataract',
      ),
      clinical: section(
        'Superficial episcleral inflammation and deeper scleral disease are not interchangeable. Their distinction needs examination.',
        'sclera',
      ),
      pathology: section(
        'Scleritis is inflammation of scleral tissue and may be associated with systemic inflammatory disease.',
        'sclera',
      ),
    },
    modelLimit:
      'One outer-coat representation without separate episclera, conjunctiva, thinning or inflammatory lesions.',
    quiz: quiz(
      'Does fading the sclera in this viewer simulate scleral disease?',
      'No. It is only a viewing aid; opacity is not a tissue-health measurement.',
    ),
  },
  {
    id: 'eye-chamber',
    study: 'eye',
    fmaIds: ['FMA58082'],
    sections: {
      anatomy: section(
        'The anterior chamber is an aqueous-filled space behind the cornea and in front of the iris, extending centrally towards the pupil and anterior lens.',
        'chamber',
        'glaucoma',
      ),
      function: section(
        'Aqueous fluid leaves the anterior segment through drainage pathways near the cornea–iris angle.',
        'glaucoma',
      ),
      clinical: section(
        'Chamber depth and angle anatomy matter, but an exploded compartment cannot be used to measure a real drainage angle.',
        'glaucoma',
      ),
      pathology: section(
        'In angle-closure glaucoma, the iris blocks drainage and eye pressure can rise rapidly. Sudden severe eye symptoms require urgent assessment.',
        'glaucoma',
      ),
    },
    modelLimit:
      'Only a left anterior chamber is supplied. No right-sided substitute, drainage meshwork, pressure or flow simulation.',
    quiz: quiz(
      'Does this coloured chamber represent solid tissue?',
      'No. It represents a fluid-containing space.',
      'chamber',
    ),
  },
  {
    id: 'ventricular-lateral',
    study: 'ventricles',
    fmaIds: ['FMA78450', 'FMA78449'],
    sections: {
      anatomy: section(
        'Each hemisphere has a lateral ventricle with a body, atrium and frontal, temporal and occipital horns. The body lies beneath the corpus callosum.',
        'ventricles',
      ),
      function: section(
        'CSF communicates with the third ventricle through an interventricular foramen.',
        'ventricles',
      ),
      clinical: section(
        'Ventricular enlargement needs assessment alongside brain tissue and the clinical picture; size alone does not establish its cause.',
        'hydrocephalus',
      ),
      pathology: section(
        'Hydrocephalus involves abnormal CSF accumulation. Enlargement can also accompany tissue loss, so it is not a diagnosis from this shape alone.',
        'hydrocephalus',
      ),
    },
    modelLimit:
      'Each complete cavity is one selectable source shape. Horns, foramina, lining and flow are not independent segments.',
    quiz: quiz(
      'Where does a lateral ventricle communicate next?',
      'With the third ventricle through an interventricular foramen.',
      'ventricles',
    ),
  },
  {
    id: 'ventricular-third',
    study: 'ventricles',
    fmaIds: ['FMA78454'],
    sections: {
      anatomy: section(
        'This narrow midline cavity lies between the thalamic and hypothalamic regions.',
        'ventricles',
      ),
      function: section(
        'It receives CSF from the lateral ventricles and communicates with the fourth through the cerebral aqueduct.',
        'ventricles',
      ),
      clinical: section(
        'Consider the third ventricle together with the lateral and fourth ventricles when learning where CSF pathways can be interrupted.',
        'ventricles',
        'hydrocephalus',
      ),
      pathology: section(
        'Blockage of CSF passage can contribute to hydrocephalus. This model supplies no obstruction or pressure measurement.',
        'hydrocephalus',
      ),
    },
    modelLimit:
      'The aqueduct and its lumen are not separate selectable structures in this study; gaps in the display are not pathological stenoses.',
    quiz: quiz(
      'Which channel links the third and fourth ventricles?',
      'The cerebral aqueduct.',
      'ventricles',
    ),
  },
  {
    id: 'ventricular-fourth',
    study: 'ventricles',
    fmaIds: ['FMA78469'],
    sections: {
      anatomy: section(
        'The fourth ventricle lies between the dorsal pons/upper medulla and cerebellum.',
        'ventricles',
      ),
      function: section(
        'Its apertures connect ventricular CSF with the subarachnoid compartment.',
        'ventricles',
      ),
      clinical: section(
        'Its posterior-fossa relationships help orient study of CSF passage and neighbouring brainstem/cerebellar anatomy.',
        'ventricles',
      ),
      pathology: section(
        'Obstruction of CSF passage is one mechanism of hydrocephalus; the compartment surface cannot identify the site or cause of a blockage.',
        'hydrocephalus',
      ),
    },
    modelLimit:
      'Median/lateral apertures, choroid plexus and fluid motion are not separately modelled in this view.',
    quiz: quiz(
      'Which major structure lies behind this ventricular space?',
      'The cerebellum.',
      'ventricles',
    ),
  },
  {
    id: 'brainstem-midbrain',
    study: 'brainstem',
    fmaIds: ['FMA61993'],
    sections: {
      anatomy: section(
        'The midbrain is the upper brainstem, between pons and diencephalon. Its dorsal tectum includes the colliculi; the aqueduct passes through it.',
        'brainstem',
      ),
      function: section(
        'It participates in eye-movement control and carries pathways between higher centres and the lower nervous system.',
        'brain',
        'brainstem',
      ),
      clinical: section(
        'Eye movements, cranial-nerve findings and limb findings must be interpreted together when localising a brainstem lesion.',
        'pathways',
      ),
      pathology: section(
        'Stroke, demyelination, trauma and tumours can affect brainstem pathways. A surface outline cannot specify which internal structures are involved.',
        'pathways',
      ),
    },
    modelLimit:
      'Seven source parts remain one compound. Colliculi, peduncles, nuclei, tracts and the aqueduct are not individually selectable here.',
    quiz: quiz(
      'Which brainstem division is immediately above the pons?',
      'The midbrain.',
      'brainstem',
    ),
  },
  {
    id: 'brainstem-pons',
    study: 'brainstem',
    fmaIds: ['FMA67943'],
    sections: {
      anatomy: section(
        'The pons lies between the midbrain and medulla, anterior to the fourth ventricle.',
        'brainstem',
        'ventricles',
      ),
      function: section(
        'It carries ascending/descending pathways and cranial-nerve circuitry, including circuitry related to eye movements.',
        'brainstem',
        'pons',
      ),
      clinical: section(
        'An abducens nerve lesion impairs eye abduction; a pontine lesion can involve additional nearby circuitry rather than an isolated nerve.',
        'pons',
      ),
      pathology: section(
        'Pontine vascular lesions produce different deficits according to the pathways and nuclei involved, not simply the external size of the pons.',
        'brainstemVessels',
      ),
    },
    modelLimit:
      'The two source halves are one compound. Tiny source remnants/duplicate faces are retained; internal nuclei and vascular territories are not segmented.',
    quiz: quiz(
      'Which ventricular space lies behind the pons?',
      'The fourth ventricle.',
      'ventricles',
    ),
  },
  {
    id: 'brainstem-medulla',
    study: 'brainstem',
    fmaIds: ['FMA62004'],
    sections: {
      anatomy: section(
        'The medulla is the lowest brainstem division, continuous with the spinal cord and lying below the pons.',
        'brainstem',
      ),
      function: section(
        'It carries sensory and motor pathways and contributes to the brainstem control of vital functions.',
        'brainstem',
        'brain',
      ),
      clinical: section(
        'Medullary lesions can combine swallowing or voice disturbance with sensory, balance and autonomic findings.',
        'brainstemVessels',
      ),
      pathology: section(
        'Lateral and medial medullary vascular syndromes involve different internal structures. The model does not map either territory.',
        'brainstemVessels',
      ),
    },
    modelLimit:
      'Paired source halves are selected together; individual nuclei, tract crossings and vessel territories are not delineated.',
    quiz: quiz(
      'Which brainstem division continues into the spinal cord?',
      'The medulla.',
      'brainstem',
    ),
  },
  {
    id: 'brainstem-cerebellum',
    study: 'brainstem',
    fmaIds: ['FMA67944'],
    sections: {
      anatomy: section(
        'The cerebellum lies behind the brainstem. The fourth ventricle intervenes between it and the dorsal pons/upper medulla.',
        'ventricles',
        'brain',
      ),
      function: section(
        'It contributes to movement coordination and balance.',
        'cerebellum',
      ),
      clinical: section(
        'Coordination, gait and balance are useful clinical domains when studying cerebellar dysfunction; they are not equivalent to muscle strength alone.',
        'cerebellum',
      ),
      pathology: section(
        'Cerebellar degeneration damages cerebellar neurons and may impair coordination and balance. This geometry does not depict atrophy or identify a cause.',
        'cerebellum',
      ),
    },
    modelLimit:
      'Both source halves form one selection. Lobules, deep nuclei, peduncles and functional zones are not independent selections.',
    quiz: quiz(
      'Does this study separate the cerebellar deep nuclei?',
      'No. The cerebellum is currently a grouped source representation.',
    ),
  },
  {
    id: 'cerebral-frontal',
    study: 'cerebral',
    fmaIds: ['FMA72970', 'FMA72969'],
    sections: {
      anatomy: section(
        'The frontal lobe lies anterior to the central sulcus.',
        'lobes',
      ),
      function: section(
        'Frontal networks contribute to voluntary movement, planning and behaviour; these functions are distributed across distinct areas.',
        'cortex',
      ),
      clinical: section(
        'Relate precentral motor function to movement while distinguishing it from broader prefrontal functions.',
        'cortex',
      ),
      pathology: section(
        'Damage to a cerebral hemisphere can impair movement on the opposite body side, but the deficit depends on the affected pathway.',
        'brain',
      ),
    },
    modelLimit:
      'Four named source gyri are grouped. This is not complete frontal cortex, a motor homunculus or a mapped language/executive territory.',
    quiz: quiz(
      'Which sulcus separates frontal from parietal cortex?',
      'The central sulcus.',
      'lobes',
    ),
  },
  {
    id: 'cerebral-parietal',
    study: 'cerebral',
    fmaIds: ['FMA72974', 'FMA72973'],
    sections: {
      anatomy: section(
        'The parietal lobe lies behind the central sulcus and above the temporal region.',
        'lobes',
      ),
      function: section(
        'Its somatosensory and association areas contribute to sensation, spatial processing and integration of information.',
        'cortex',
      ),
      clinical: section(
        'Distinguish primary sensory findings from higher-order spatial or perceptual difficulties.',
        'cortex',
        'pathways',
      ),
      pathology: section(
        'Cortical sensory impairment depends on the affected region and connections; this surface does not predict a full sensory syndrome.',
        'pathways',
      ),
    },
    modelLimit:
      'Postcentral/angular/supramarginal and superior-parietal source groups are combined. Sensory maps and individual functional networks are absent.',
    quiz: quiz(
      'Is the postcentral region anterior or posterior to the central sulcus?',
      'Posterior.',
      'cortex',
    ),
  },
  {
    id: 'cerebral-temporal',
    study: 'cerebral',
    fmaIds: ['FMA72972', 'FMA72971'],
    sections: {
      anatomy: section(
        'The temporal lobe lies below the lateral sulcus.',
        'lobes',
      ),
      function: section(
        'Temporal regions contribute to hearing, memory and association processing; their roles are not confined to one surface patch.',
        'cortex',
        'brain',
      ),
      clinical: section(
        'Distinguish auditory, language and memory functions instead of assigning one label to the entire temporal lobe.',
        'cortex',
        'temporal',
      ),
      pathology: section(
        'Posterior temporal injury can affect language comprehension, but localisation varies between people and involves a wider network.',
        'temporal',
      ),
    },
    modelLimit:
      'The original compound lacks superior temporal parts, supplied separately here; it is not a complete temporal lobe or segmented hippocampus.',
    quiz: quiz(
      'Which sulcus separates this region from overlying frontal/parietal cortex?',
      'The lateral sulcus.',
      'lobes',
    ),
  },
  {
    id: 'cerebral-occipital',
    study: 'cerebral',
    fmaIds: ['FMA72976', 'FMA72975'],
    sections: {
      anatomy: section(
        'The occipital lobe is the posterior cerebral region, with the parieto-occipital sulcus marking an important medial boundary.',
        'lobes',
      ),
      function: section(
        'Primary and associated visual areas process visual information; visual processing also extends beyond the occipital lobe.',
        'visual',
      ),
      clinical: section(
        'A visual-field defect must be localised along the visual pathway, not assumed to arise in the eye.',
        'visual',
      ),
      pathology: section(
        'Occipital visual-cortex injury can cause a corresponding visual-field loss. The whole-lobe surface does not encode an individual field map.',
        'visual',
      ),
    },
    modelLimit:
      'One surface per side; calcarine banks, primary visual cortex and retinotopic subdivisions are not independently labelled.',
    quiz: quiz(
      'Does this lobe mesh show a validated visual-field map?',
      'No. It identifies a source lobe, not a functional retinotopic map.',
    ),
  },
  {
    id: 'cerebral-insula',
    study: 'cerebral',
    fmaIds: ['FMA72978', 'FMA72977'],
    sections: {
      anatomy: section(
        'The insula lies deep in the lateral fissure beneath the surrounding opercula.',
        'cortex',
      ),
      function: section(
        'Insular and opercular regions participate in gustatory processing.',
        'taste',
      ),
      clinical: section(
        'Its hidden position explains why overlying lobes must be removed or faded to inspect it. Surface exposure does not identify every internal connection.',
        'cortex',
      ),
      pathology: pending(
        'A disease-specific insular syndrome is not assigned here: the supplied surface cannot establish functional territories or the extent of an individual lesion.',
      ),
    },
    modelLimit:
      'Whole insular source surfaces only; individual gyri, autonomic/gustatory subregions and adjacent white matter are not segmented.',
    quiz: quiz(
      'Why is the insula difficult to see on an intact lateral brain view?',
      'The surrounding opercula cover it in the lateral fissure.',
      'cortex',
    ),
  },
  {
    id: 'cerebral-superior-temporal-anterior',
    study: 'cerebral',
    fmaIds: ['FMA72801', 'FMA72800'],
    sections: {
      anatomy: section(
        'This is the source-defined anterior part of the superior temporal gyrus, not the entire gyrus.',
        'temporal',
      ),
      function: section(
        'The broader superior temporal region participates in auditory processing. This source subdivision is not a validated primary auditory area.',
        'temporal',
      ),
      clinical: section(
        'An anatomical part boundary must not be used as a substitute for an individual functional localisation.',
        'temporal',
      ),
      pathology: pending(
        'No lesion-specific syndrome is assigned to this anterior source fragment; adjacent cortex and connections would need clinical assessment.',
      ),
    },
    modelLimit:
      'Additional ISA source part, absent from the original brain aggregate. It is not independently validated Heschl cortex or an auditory territory.',
    quiz: quiz(
      'Does the label identify an entire superior temporal gyrus?',
      'No. It identifies its supplied anterior source subdivision.',
    ),
  },
  {
    id: 'cerebral-superior-temporal-posterior',
    study: 'cerebral',
    fmaIds: ['FMA72805', 'FMA72804'],
    sections: {
      anatomy: section(
        'This is the separately supplied posterior part of the superior temporal gyrus.',
        'temporal',
      ),
      function: section(
        'Posterior superior temporal regions contribute to language-related processing within a broader network.',
        'temporal',
      ),
      clinical: section(
        'Language comprehension cannot be localised by this mesh alone; the relevant cortical distribution varies between people.',
        'temporal',
      ),
      pathology: section(
        'A posterior temporal lesion may affect comprehension, but this source part must not be equated with a complete Wernicke area.',
        'temporal',
      ),
    },
    modelLimit:
      'Additional source geometry, not proof of language dominance, a complete functional area or patient-specific lesion localisation.',
    quiz: quiz(
      'Can side and source name alone establish language dominance?',
      'No. This source model contains no individual functional-language evidence.',
    ),
  },
];
