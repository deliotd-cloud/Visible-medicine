// Original factual orientation notes. Reading references are not image licences.
const anatomy = 'https://www.vhlab.umn.edu/atlas/coronary-system-tutorial/coronary-arterial-anatomy.shtml';
const angiography = 'https://www.nhlbi.nih.gov/health/cardiac-catheterization/during';
const projections = 'https://pubmed.ncbi.nlm.nih.gov/15744720/';
const citations = [anatomy, angiography, projections] as const;

export const coronaryArterialXrayTopics = {
  FMA3855: {
    title: 'Left main coronary angiographic orientation',
    body: 'The left main usually starts at the left aortic sinus and divides into LAD and circumflex branches. In contrast coronary angiography, identify the shared proximal segment before following those two routes.',
    bullets: ['The selected source is labelled left coronary trunk. Its rendered ends are not proof of a complete ostium or bifurcation; branching variants must be assessed on the actual study.'],
    citations,
  },
  FMA3862: {
    title: 'LAD angiographic orientation',
    body: 'The anterior interventricular branch is also called the left anterior descending artery (LAD). Its usual course runs toward the apex along the anterior interventricular groove, unlike the circumflex route in the atrioventricular groove.',
    bullets: ['This selected source is an aggregate of 18 supplied pieces. A coloured aggregate does not establish that each piece is a separately labelled angiographic branch or that its lumen is continuous.'],
    citations,
  },
  FMA3895: {
    title: 'Circumflex angiographic orientation',
    body: 'The circumflex usually branches from the left main and follows the left atrioventricular groove. Use that course to distinguish it from the LAD when interpreting a contrast coronary angiogram.',
    bullets: ['Six supplied pieces form this selection. Do not infer coronary dominance or a complete set of marginal branches from this retained aggregate.'],
    citations,
  },
  FMA3802: {
    title: 'Right coronary angiographic orientation',
    body: 'The right coronary artery usually arises from the right aortic sinus and follows the right atrioventricular groove. This differs from the left main origin and its LAD–circumflex division.',
    bullets: ['The selected source is labelled right coronary trunk, not a validated complete coronary tree. Distal branches and dominance require inspection of the actual examination.'],
    citations,
  },
} as const;
