import type { ReasoningConcept } from './reasoning-questions';

const openstax = {
  title: 'OpenStax: The Central Nervous System',
  url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system',
};
const texasTech = {
  title: 'Texas Tech: Viscera of the head and neck',
  url: 'https://anatomy.ttuhscep.edu/anatomytables/viscera_head_neck.html',
};
const utHealth = {
  title: 'UTHealth: Neuroanatomy Online, Lab 5',
  url: 'https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p12_index.html',
};
type Draft = Omit<ReasoningConcept, 'region' | 'sourceTissue' | 'readiness' | 'revision'>;

// Source meshes identify whole structures only. These drafts require review of
// this exact revision before being presented as approved teaching material.
export const deepBrainReasoningConcepts: readonly ReasoningConcept[] = ([
  {
    key: 'deep-brain-caudate',
    bindings: [{ fma: 'FMA72826', side: 'right', file: 'FJ1802' }, { fma: 'FMA72827', side: 'left', file: 'FJ1754' }],
    prompt: 'Which deep cerebral nucleus follows a long C-shaped course rather than forming the lenticular pair?',
    explanation: 'The caudate curves through the cerebrum. This surface identifies the named nucleus, but cannot show its internal subdivisions or prove circuit connectivity.',
    references: [openstax],
    distractors: ['deep-brain-putamen', 'deep-brain-pallidum', 'deep-brain-thalamus'],
  },
  {
    key: 'deep-brain-putamen',
    bindings: [{ fma: 'FMA72828', side: 'right', file: 'FJ1823' }, { fma: 'FMA72829', side: 'left', file: 'FJ1776' }],
    prompt: 'Which basal nucleus lies lateral to the globus pallidus within the lenticular pair?',
    explanation: 'The putamen is the lateral member of that pair. The source surface does not establish internal nuclei, pathways or patient registration.',
    references: [openstax],
    distractors: ['deep-brain-pallidum', 'deep-brain-caudate', 'deep-brain-thalamus'],
  },
  {
    key: 'deep-brain-pallidum',
    bindings: [{ fma: 'FMA72830', side: 'right', file: 'FJ1805' }, { fma: 'FMA72831', side: 'left', file: 'FJ1757' }],
    prompt: 'Which basal nucleus lies medial to the putamen in the lenticular pair?',
    explanation: 'The globus pallidus lies medial to the putamen. This whole-structure mesh cannot resolve pallidal segments or demonstrate neural circuits.',
    references: [openstax],
    distractors: ['deep-brain-putamen', 'deep-brain-caudate', 'deep-brain-thalamus'],
  },
  {
    key: 'deep-brain-thalamus',
    bindings: [{ fma: 'FMA258714', side: 'right', file: 'FJ1827' }, { fma: 'FMA258716', side: 'left', file: 'FJ1782' }],
    prompt: 'Which large diencephalic structure forms part of the lateral wall of the third ventricle and relays information towards cortex?',
    explanation: 'The thalamus has this position and broad relay role. Its source surface cannot resolve individual thalamic nuclei, signal pathways or patient registration.',
    references: [texasTech],
    distractors: ['deep-brain-caudate', 'deep-brain-putamen', 'deep-brain-pallidum'],
  },
  {
    key: 'deep-brain-lateral-geniculate',
    bindings: [{ fma: 'FMA73303', side: 'right', file: 'FJ1813' }, { fma: 'FMA73304', side: 'left', file: 'FJ1766' }],
    prompt: 'Which named geniculate body is associated with the visual relay rather than the auditory relay?',
    explanation: 'The lateral geniculate body is associated with vision. Its mesh identifies the structure only; it does not demonstrate visual pathway integrity or registration.',
    references: [utHealth],
    distractors: ['deep-brain-medial-geniculate', 'deep-brain-caudate', 'deep-brain-putamen'],
  },
  {
    key: 'deep-brain-medial-geniculate',
    bindings: [{ fma: 'FMA73309', side: 'right', file: 'FJ1816' }, { fma: 'FMA73310', side: 'left', file: 'FJ1816M' }],
    prompt: 'Which named geniculate body is associated with the auditory relay rather than the visual relay?',
    explanation: 'The medial geniculate body is associated with hearing. Its mesh identifies the structure only; it does not demonstrate auditory pathway integrity or registration.',
    references: [utHealth],
    distractors: ['deep-brain-lateral-geniculate', 'deep-brain-caudate', 'deep-brain-putamen'],
  },
] satisfies Draft[]).map(concept => ({ ...concept, region: 'head-neck', sourceTissue: 'neural-organ', readiness: 'draft', revision: 1 }));
