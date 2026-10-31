import type { NestedConcept } from './nested-teaching';

export const coronaryVenousTeachingReferences = {
  smallCardiacVenographyCase: {
    title: 'Sifrig et al. · Anomalous small cardiac vein on venography (2018 case report)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30473972/',
    scopedToConcept: true,
  },
  smallCardiacEchoCase: {
    title: 'Lu et al. · Small cardiac vein drainage with coronary sinus ostial atresia (2025 case report)',
    url: 'https://doi.org/10.1002/jcu.23993',
    scopedToConcept: true,
  },
  coronarySinusVenography: {
    title: 'Blendea et al. · Coronary venous anatomy by rotational venography (2007)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17765613/',
    scopedToConcept: true,
  },
  coronarySinusEchoView: {
    title: 'Mai et al. · Coronary sinus appearance on echocardiography (2006)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1860876/',
  },
  coronarySinusEchoDilation: {
    title: 'Kolski et al. · Dilated coronary sinus: pressure overload and persistent left SVC (2011)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21827538/',
  },
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
      xray: draft('Contrast coronary venography can depict the coronary sinus and its tributaries as X-ray projections. A rotational venography study in patients undergoing cardiac resynchronization therapy assessed sinus size and variable tributary presence, calibre and angulation. Use this surface for orientation to an opacified sinus, not as a plain chest-radiograph vessel map. Restore assembled anatomy before comparison; explosion is not a projection. No contrast filling, ostium, patent lumen, connected tributaries, measured calibre, instrument route or patient-space registration is supplied.', 'coronarySinusVenography'),
      ultrasound: draft('On transthoracic echocardiography, a dilated coronary sinus may appear as an echo-free structure in the atrioventricular groove on a parasternal long-axis view. Distinguish it from the descending aorta or a localized pericardial fluid collection. Enlargement can accompany right atrial pressure overload or a persistent left superior vena cava; appearance alone does not establish the cause. This static surface provides no echo window, Doppler flow, contrast transit or validated diameter.', 'coronarySinusEchoView', 'coronarySinusEchoDilation'),
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
      xray: draft("Contrast X-ray venography can show the small cardiac vein when it fills with contrast. A published case depicted an enlarged anomalous vein along the right heart border, with abnormal drainage to the superior vena cava in the setting of caval obstruction. This is a variant case, not a normal chest-radiograph landmark or a prevalence estimate. Compare course and drainage on the acquired views; the two grouped model surfaces do not establish an open lumen, junction or patient-specific route.", 'smallCardiacVenographyCase'),
      ultrasound: draft("A case report used echocardiography to identify an enlarged small cardiac vein communicating with a dilated coronary sinus in coronary sinus ostial atresia. Contrast echocardiography and coronary CT clarified anomalous drainage into the right atrium. The teaching point is to follow continuity across complementary images rather than infer termination from one view. This unusual dilated-vein case does not establish routine visibility of a normal small cardiac vein. These static surfaces supply no ultrasound window, Doppler measurement or registered scan.", 'smallCardiacEchoCase'),
      ct: draft('Cardiac CT can map coronary venous anatomy when a small vein is visible on acquired images. Its termination must be assessed on those images; the two grouped source surfaces do not prove a connection to the coronary sinus or another vein.', 'coronarySinusImaging', 'smallCardiacVariation'),
      mri: draft('Dedicated cardiovascular MR techniques can depict coronary venous branches, but depiction of this small vein is not guaranteed. Any apparent course or ending needs assessment in acquired images, not inference from these unregistered surfaces.', 'coronarySinusImaging', 'smallCardiacVariation'),
    },
    modelLimit: 'Two original PART-OF files grouped under one source identity. No branch names, junction, patent lumen, flow, procedure path, scan registration or clinical finding are inferred.',
    quiz: { question: 'Are the two small cardiac vein source files two named branches?', answer: 'No. Both files belong to one source-labelled selection.', references: [], basis: 'model-scope' },
  },
];
