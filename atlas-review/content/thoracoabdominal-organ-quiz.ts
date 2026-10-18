export const thoracoabdominalOrganQuizGroups = {
  heart: ['FMA7088'], esophagus: ['FMA7131'], thymus: ['FMA9607'],
  stomach: ['FMA7148'], smallIntestine: ['FMA7200'], largeIntestine: ['FMA7201'],
  appendix: ['FMA14542'], ileocecalJunction: ['FMA11338'],
} as const;
export type ThoracoabdominalOrganQuizGroup = keyof typeof thoracoabdominalOrganQuizGroups;

const upperGI = 'https://www.radiologyinfo.org/en/info/uppergi';
export const thoracoabdominalOrganQuizQuestions = {
  heart: {
    body: 'What is needed to assess cardiac motion, rather than just this donor heart shape?',
    choices: ['Acquired images over time', 'A different viewing angle of the same mesh', 'The mesh color alone', 'A single measurement from the mesh'],
    correctAnswer: 'Acquired images over time',
    explanation: 'Assessing cardiac motion needs acquired images spanning that motion. Rotating a static donor mesh changes the viewpoint, not the represented physiology.',
    reference: 'https://www.radiologyinfo.org/en/info/cardiacmr',
  },
  esophagus: {
    body: 'During an upper GI contrast examination, what can fluoroscopy show as a person swallows?',
    choices: ['Electrical activity in the esophageal wall', 'Contrast outlining the esophageal lumen', 'Microscopic tissue structure', 'Blood flow through coronary arteries'],
    correctAnswer: 'Contrast outlining the esophageal lumen',
    explanation: 'Fluoroscopy follows swallowed contrast through the esophagus and shows the lumen in motion. A static surface mesh does not show swallowing.',
    reference: upperGI,
  },
  thymus: {
    body: 'Why is one donor thymus outline insufficient to judge every thymus CT appearance?',
    choices: ['The thymus is always invisible on CT', 'The thymus always has the same amount of fat', 'Its appearance changes with age and fatty involution', 'CT shows only thymic blood flow'],
    correctAnswer: 'Its appearance changes with age and fatty involution',
    explanation: 'Normal thymic CT appearance varies with age as thymic tissue undergoes fatty involution. A fixed donor outline is not a diagnostic standard.',
    reference: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9371532/',
  },
  stomach: {
    body: 'Which structures are included in an upper GI contrast examination?',
    choices: ['Colon, rectum and appendix', 'Kidneys, ureters and bladder', 'Liver, gallbladder and pancreas', 'Esophagus, stomach and duodenum'],
    correctAnswer: 'Esophagus, stomach and duodenum',
    explanation: 'An upper GI examination uses swallowed contrast to evaluate the esophagus, stomach and duodenum. This donor mesh alone does not show the contrast study.',
    reference: upperGI,
  },
  smallIntestine: {
    body: 'In a small bowel follow-through, what is tracked over time?',
    choices: ['Oral contrast passing through the small bowel', 'Air moving through the lungs', 'Contrast filling the coronary arteries', 'Urine moving through the bladder'],
    correctAnswer: 'Oral contrast passing through the small bowel',
    explanation: 'A small bowel follow-through follows swallowed contrast through the small intestine on a sequence of images. A donor surface mesh cannot show that passage.',
    reference: 'https://www.radiologyinfo.org/en/info/small-bowel-follow-thru',
  },
  largeIntestine: {
    body: 'Which organ is the main target of a lower GI contrast examination?',
    choices: ['Esophagus', 'Colon', 'Stomach', 'Thymus'],
    correctAnswer: 'Colon',
    explanation: 'A lower GI contrast examination evaluates the colon. Its contrast images provide information that a static colon surface does not.',
    reference: 'https://www.radiologyinfo.org/en/info/lowergi',
  },
  appendix: {
    body: 'If an appendix is not seen on ultrasound, what can that finding alone establish?',
    choices: ['The appendix is absent', 'The appendix is normal', 'Neither absence nor exclusion of appendicitis', 'Appendicitis is confirmed'],
    correctAnswer: 'Neither absence nor exclusion of appendicitis',
    explanation: 'Nonvisualization alone does not prove that the appendix is absent or normal and does not rule out appendicitis. Interpretation requires the rest of the examination and clinical context.',
    reference: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4805616/',
  },
  ileocecalJunction: {
    body: 'Which relationship identifies the ileocecal junction?',
    choices: ['Esophagus joins stomach', 'Duodenum joins jejunum', 'Appendix joins rectum', 'Terminal ileum joins caecum'],
    correctAnswer: 'Terminal ileum joins caecum',
    explanation: 'The terminal ileum meets the caecum at the ileocecal junction. The appendix is a separate structure; a donor mesh does not demonstrate valve function.',
    reference: 'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html',
  },
} as const;
