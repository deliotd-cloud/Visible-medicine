import type { NestedConcept } from './nested-teaching';

export const coronaryVenousTeachingReferences = {
  coronaryVenousAnatomy: {
    title: 'NCBI Bookshelf · Anatomy of the cardiac venous system',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK549786/',
  },
  coronaryVenousHeart: {
    title: 'OpenStax · Heart anatomy',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy',
  },
};
const draft = (body: string, ...references: string[]) => ({ body, references, readiness: 'draft' as const });
const pending = () => ({ body: 'Structure-specific clinical teaching remains pending specialist review.', references: [], readiness: 'pending' as const });

export const coronaryVenousConcepts: NestedConcept[] = [
  {
    id: 'coronary-sinus', study: 'coronary-venous', fmaIds: ['FMA4706'],
    sections: {
      anatomy: draft('The coronary sinus lies on the posterior aspect of the heart and is a major receiving channel for cardiac veins. This one-file selection shows a source-labelled surface, not its openings or tributary junctions.', 'coronaryVenousAnatomy', 'coronaryVenousHeart'),
      function: draft('The coronary sinus is part of the heart’s venous return. A static surface cannot show moving blood, an open lumen or how much any territory drains through it.', 'coronaryVenousAnatomy'),
      clinical: pending(), pathology: pending(),
    },
    modelLimit: 'One original PART-OF file. No ostium, connected lumen, flow, procedure path, scan registration or clinical finding is validated.',
    quiz: { question: 'Does a source-labelled coronary sinus surface prove its openings are connected?', answer: 'No. The source surface establishes its label and shape only.', references: [], basis: 'model-scope' },
  },
  {
    id: 'small-cardiac-vein', study: 'coronary-venous', fmaIds: ['FMA4714'],
    sections: {
      anatomy: draft('The small cardiac vein is a named cardiac venous structure. The source assigns two files to this one concept; they remain one selection, not two separately named branches. Its exact junction cannot be read from mesh proximity.', 'coronaryVenousAnatomy'),
      function: draft('Cardiac veins participate in returning blood from heart muscle. These two static source surfaces do not establish a complete drainage territory, flow direction or a fixed connection.', 'coronaryVenousAnatomy', 'coronaryVenousHeart'),
      clinical: pending(), pathology: pending(),
    },
    modelLimit: 'Two original PART-OF files grouped under one source identity. No branch names, junction, patent lumen, flow, procedure path, scan registration or clinical finding are inferred.',
    quiz: { question: 'Are the two small cardiac vein source files two named branches?', answer: 'No. Both files belong to one source-labelled selection.', references: [], basis: 'model-scope' },
  },
];
