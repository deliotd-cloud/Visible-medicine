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
  coronarySinusImaging: {
    title: 'Chen et al. · CT and MRI of coronary sinus variants (2014)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4195839/',
  },
  smallCardiacVariation: {
    title: 'Cendrowska-Pinkosz · Small cardiac vein variation (2004)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15232770/',
  },
};
const draft = (body: string, ...references: string[]) => ({ body, references, readiness: 'draft' as const });

export const coronaryVenousConcepts: NestedConcept[] = [
  {
    id: 'coronary-sinus', study: 'coronary-venous', fmaIds: ['FMA4706'],
    sections: {
      anatomy: draft('The coronary sinus lies on the posterior aspect of the heart and is a major receiving channel for cardiac veins. This one-file selection shows a source-labelled surface, not its openings or tributary junctions.', 'coronaryVenousAnatomy', 'coronaryVenousHeart'),
      function: draft('The coronary sinus is part of the heart’s venous return. A static surface cannot show moving blood, an open lumen or how much any territory drains through it.', 'coronaryVenousAnatomy'),
      clinical: draft('The coronary sinus is relevant when clinicians assess access to the cardiac venous system. Its course and openings can vary, so this surface is an orientation aid only; it cannot guide an instrument or establish a patient’s venous route.', 'coronarySinusImaging'),
      pathology: draft('A widened coronary sinus can accompany raised right-heart pressure or an anomalous venous connection. Congenital wall or ostial abnormalities are also described. Shape in this source model cannot identify enlargement, a shunt or disease in any person.', 'coronarySinusImaging'),
    },
    imaging: {
      ct: draft('Cardiac CT can show the coronary sinus in relation to nearby chambers and vessels on acquired multiplanar images. The review illustrates variants including enlargement and abnormal connections; none is represented as a finding in this unregistered surface.', 'coronarySinusImaging'),
      mri: draft('Cardiovascular MRI can depict the coronary sinus and surrounding anatomy; selected sequences can also assess flow or shunt physiology. This static model supplies neither MR signal nor flow information and has no registered scan correspondence.', 'coronarySinusImaging'),
    },
    modelLimit: 'One original PART-OF file. No ostium, connected lumen, flow, procedure path, scan registration or clinical finding is validated.',
    quiz: { question: 'Does a source-labelled coronary sinus surface prove its openings are connected?', answer: 'No. The source surface establishes its label and shape only.', references: [], basis: 'model-scope' },
  },
  {
    id: 'small-cardiac-vein', study: 'coronary-venous', fmaIds: ['FMA4714'],
    sections: {
      anatomy: draft('The small cardiac vein is a named cardiac venous structure. The source assigns two files to this one concept; they remain one selection, not two separately named branches. Its exact junction cannot be read from mesh proximity.', 'coronaryVenousAnatomy'),
      function: draft('Cardiac veins participate in returning blood from heart muscle. These two static source surfaces do not establish a complete drainage territory, flow direction or a fixed connection.', 'coronaryVenousAnatomy', 'coronaryVenousHeart'),
      clinical: draft('The small cardiac vein has variable drainage in a specimen study, including endings outside the coronary sinus. A named surface here therefore cannot stand in for an individual venous map or a procedural route.', 'smallCardiacVariation'),
      pathology: draft('Variation in where the small cardiac vein ends is an anatomic observation, not by itself a disease finding. The cited specimen study does not establish a structure-specific lesion or diagnosis for this model.', 'smallCardiacVariation'),
    },
    imaging: {
      ct: draft('Cardiac CT can map coronary venous anatomy when a small vein is visible on acquired images. Its termination must be assessed on those images; the two grouped source surfaces do not prove a connection to the coronary sinus or another vein.', 'coronarySinusImaging', 'smallCardiacVariation'),
      mri: draft('Dedicated cardiovascular MR techniques can depict coronary venous branches, but depiction of this small vein is not guaranteed. Any apparent course or ending needs assessment in acquired images, not inference from these unregistered surfaces.', 'coronarySinusImaging', 'smallCardiacVariation'),
    },
    modelLimit: 'Two original PART-OF files grouped under one source identity. No branch names, junction, patent lumen, flow, procedure path, scan registration or clinical finding are inferred.',
    quiz: { question: 'Are the two small cardiac vein source files two named branches?', answer: 'No. Both files belong to one source-labelled selection.', references: [], basis: 'model-scope' },
  },
];
