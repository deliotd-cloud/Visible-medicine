// Original orientation notes. Reading links are not licences for text or images.
const catheter = 'https://www.radiologyinfo.org/en/info/angiocath';
const anatomy = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
const lateralAortography = 'https://pubmed.ncbi.nlm.nih.gov/6407931/';
const conventionalAngiography = 'https://pubmed.ncbi.nlm.nih.gov/11724043/';

export const abdominalArterialXrayTopics = {
  'abdominal-aorta': {
    title: 'Abdominal aortic angiographic orientation',
    body: 'On an acquired contrast X-ray angiogram, follow the abdominal aorta toward its common iliac division. Locate visible visceral branch origins on the actual study before relating them to this separate donor surface.',
    bullets: [
      'An aortogram is a contrast examination. An ordinary abdominal radiograph does not trace the aortic lumen or its branches.',
      'The source surface supplies neither a measured patient calibre nor a complete map of every branch origin. Projection overlap and individual variation require review of the acquired images.',
    ],
    citations: [catheter, anatomy, lateralAortography],
  },
  celiac: {
    title: 'Coeliac trunk angiographic orientation',
    body: 'Find the short proximal coeliac trunk at its aortic origin on the acquired contrast study, then trace only branches that are actually demonstrated. The usual left gastric, splenic and common hepatic routes are orientation cues, not an assumed donor trifurcation.',
    bullets: [
      'The supplied coeliac selection is an aggregate of retained source pieces. Its ends do not establish three complete or continuous branch lumens.',
      'Original aortographic observations document variation in the coeliac and superior mesenteric origins; they do not certify this model as a patient-specific branching pattern.',
    ],
    citations: [anatomy, catheter, lateralAortography, conventionalAngiography],
  },
  sma: {
    title: 'Superior mesenteric angiographic orientation',
    body: 'On an acquired contrast X-ray study, locate the superior mesenteric artery below the coeliac origin and follow the opacified vessel into the mesenteric region. Separate the parent trunk from branches visible in that examination.',
    bullets: [
      'A projected branch crossing does not prove that two source surfaces join. This donor segment cannot identify bowel perfusion, occlusion or an intervention target.',
      'The cited conventional angiographic study evaluated coeliac, superior and inferior mesenteric arteries in its own cohort; it provides no universal depiction rate or diagnostic threshold for this atlas.',
    ],
    citations: [anatomy, catheter, lateralAortography, conventionalAngiography],
  },
  ima: {
    title: 'Inferior mesenteric angiographic orientation',
    body: 'Look for the inferior mesenteric artery arising from the lower abdominal aorta on the acquired contrast study, and confirm any visible left-colonic continuation from that study rather than the model camera.',
    bullets: [
      'Its smaller calibre and projection overlap make an unseen branch on one image an uncertain finding, not proof of anatomical absence.',
      'This retained trunk does not validate marginal collateral continuity, a vascular territory or a patient-specific treatment route.',
    ],
    citations: [anatomy, catheter, conventionalAngiography],
  },
} as const;
