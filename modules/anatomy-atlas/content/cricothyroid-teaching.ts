import type { NestedConcept, NestedSection } from './nested-teaching';

export const cricothyroidTeachingReferences = {
  cricothyroidUniversity: {
    title: 'TTUHSC El Paso · Laryngeal muscles and cartilages',
    url: 'https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html',
  },
  cricothyroidBellies: {
    title:
      'Mu & Sanders · Human cricothyroid muscle bellies (research abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18191374/',
  },
  cricothyroidParalysis: {
    title:
      'Koufman et al. · Cricothyroid status and vocal-fold position (research abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/7715379/',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});
export const cricothyroidConcepts: NestedConcept[] = [
  {
    id: 'cricothyroid-source-parts',
    study: 'cricothyroid',
    fmaIds: ['FMA46611', 'FMA46612', 'FMA46613', 'FMA46614'],
    sections: {
      anatomy: draft(
        'Cricothyroid extends from the cricoid arch to the lower thyroid cartilage. The selected surface is one source-labelled straight or oblique part, not the entire muscle. A human anatomical study described rectus, oblique and horizontal bellies; the supplied two part types do not establish completeness.',
        'cricothyroidUniversity',
        'cricothyroidBellies',
      ),
      function: draft(
        'As a muscle group, cricothyroid helps draw the thyroid cartilage forward and lengthen the vocal ligaments. Its principal motor supply is the external branch of the superior laryngeal nerve. These static source parts do not simulate contraction or establish the independent action of each belly.',
        'cricothyroidUniversity',
        'cricothyroidBellies',
      ),
      clinical: draft(
        'Relate muscle function to its motor supply, but do not infer nerve integrity from the position of a rendered surface. In a study of 26 people with unilateral vocal-fold paralysis, endoscopic fold position did not predict the lesion site identified by laryngeal electromyography. This atlas provides neither examination.',
        'cricothyroidUniversity',
        'cricothyroidParalysis',
      ),
      pathology: draft(
        'The meshes do not depict denervation or paralysis. The cited clinical study found no dependable association between cricothyroid electromyographic status and resting vocal-fold position. Do not turn a source-model pose or apparent gap into a diagnosis; no pathological geometry is supplied here.',
        'cricothyroidParalysis',
      ),
    },
    modelLimit:
      'Four supplied muscle-part surfaces; no separately identified horizontal belly, intramuscular nerves, airway, thyroid gland, functional movement or scan registration. Thyroid/cricoid cartilages are optional navigation landmarks, not tissue parents. Twelve audited artifact faces were omitted only from the straight-part display derivatives; all retained geometry and the raw originals are preserved. Anatomy and clinical teaching remain unvalidated drafts.',
    quiz: {
      question:
        'Which named branch principally supplies cricothyroid: the external superior laryngeal branch or the recurrent laryngeal nerve?',
      answer:
        'The external branch of the superior laryngeal nerve. The atlas does not show its intramuscular branches or establish individual innervation variants.',
      references: ['cricothyroidUniversity', 'cricothyroidBellies'],
      basis: 'primary-reference',
    },
  },
];
