import type { NestedConcept, NestedSection } from './nested-teaching';

export const cricothyroidTeachingReferences = {
  cricothyroidCTApproximation: {
    title: 'Pickuth et al. (2000) · CT before and after cricothyroid approximation (research abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10971539/',
  },
  cricothyroidMicroMRI: {
    title: 'Chen et al. (2012) · Excised human larynx reconstruction with 7-T micro-MRI (research abstract)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21816571/',
  },
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
    imaging: {
      ct: draft(
        'CT assessment of cricothyroid distance concerns the cartilaginous framework, not a direct measurement of either selected muscle part. In a study of 29 patients undergoing cricothyroid approximation, spiral CT assessed the distance before and after surgery; greater reduction was associated with greater pitch elevation. This is evidence about postoperative framework relationships, not proof that CT separates the straight and oblique bellies or measures their contraction. Inspect the acquired images and clinical context; do not infer muscle strength, nerve integrity or an operative target from the gap between these atlas surfaces. Separation here is a viewing aid, not a surgical simulation or patient measurement.',
        'cricothyroidCTApproximation',
      ),
      mri: draft(
        'Distinguish research micro-MRI from routine in-vivo neck MRI. Chen and colleagues scanned one excised postmortem human larynx at 7 T and manually reconstructed most intrinsic muscles with the surrounding cartilages. The cricothyroid joint remained poorly defined. That study does not establish routine clinical visibility of each straight or oblique belly, normal signal thresholds or diagnostic performance for denervation. These four source-labelled meshes were not segmented from that experiment or from your patient’s MRI. Use them to learn named relationships, not to assign voxel boundaries, infer a muscle lesion or transfer a research measurement into a clinical report.',
        'cricothyroidMicroMRI',
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
