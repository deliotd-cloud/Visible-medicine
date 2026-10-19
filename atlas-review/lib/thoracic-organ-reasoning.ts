import type { ReasoningConcept } from './reasoning-questions';

const mediastinum = {
  title: 'Texas Tech: lungs and mediastina',
  url: 'https://anatomy.ttuhscep.edu/schemes/lungs_ans.html',
};
type Draft = Omit<ReasoningConcept, 'region' | 'sourceTissue' | 'sourceTree' | 'readiness' | 'revision' | 'references'>;

// Original questions about existing source-bound organs. Regional sessions have
// two available alternatives; whole-body sessions also admit the abdominal one.
export const thoracicOrganReasoningConcepts: readonly ReasoningConcept[] = ([
  {
    key: 'thoracic-trachea', bindings: [{ fma: 'FMA7394', file: 'FJ2541', side: 'unpaired' }],
    prompt: 'Which conducting airway lies anterior to the oesophagus and divides into the two main bronchi?',
    explanation: 'The trachea conducts air towards the main bronchi; the posterior oesophagus carries swallowed material towards the stomach. This reference surface does not prove airway patency or continuity with every bronchial segment.',
    distractors: ['thoracic-esophagus', 'thoracic-thymus', 'abdominal-stomach'],
  },
  {
    key: 'thoracic-esophagus', bindings: [{ fma: 'FMA7131', file: 'FJ2563', side: 'unpaired' }],
    prompt: 'Which conduit descends behind the trachea in the upper mediastinum on its route to the stomach?',
    explanation: 'The oesophagus follows this posterior relationship, unlike the anterior airway. Its source surface is not a swallowing study and does not establish luminal calibre, motility or a patient-specific obstruction.',
    distractors: ['thoracic-trachea', 'thoracic-thymus', 'abdominal-stomach'],
  },
  {
    key: 'thoracic-thymus', bindings: [{ fma: 'FMA9607', files: ['FJ3150', 'FJ3151'], side: 'unpaired' }],
    prompt: 'Which mediastinal lymphoid organ supports T-cell differentiation rather than conducting air or swallowed material?',
    explanation: 'The thymus has this immune role. The model cannot show cellular differentiation or establish age-related appearance; its two retained source components do not imply two independent organs.',
    distractors: ['thoracic-trachea', 'thoracic-esophagus', 'abdominal-spleen'],
  },
] satisfies Draft[]).map(concept => ({ ...concept, region: 'thorax', sourceTissue: 'organ', sourceTree: 'partof', readiness: 'draft', revision: 1, references: [mediastinum] }));
