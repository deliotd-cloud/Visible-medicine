// Original orientation prose only; no external image, figure, table or scan is included.
export const laryngealMuscleImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  clinical: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7056085/',
  research: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8349453/',
} as const;

export const laryngealMuscleImagingTopics = {
  posterior: {
    landmark: 'Anatomical route: posterior cricoid lamina to the same-side arytenoid muscular process.',
    ct: 'On CT, locate the broad posterior cricoid lamina, then orient to the arytenoid on the same side. The posterior cricoarytenoid can be visible behind the cricoid; intervening fat helps distinguish its edge from the pharynx.',
    mri: 'On MRI, use the posterior cricoid and same-side arytenoid to find the posterior cricoarytenoid region. Fat between the muscle and pharynx can help define its border; sparse fat makes that separation less clear.',
  },
  lateral: {
    landmark: 'Anatomical route: cricoid arch to the same-side arytenoid muscular process.',
    ct: 'On CT, use the cricoid arch and same-side arytenoid to orient the lateral muscle region; its contour is not certified.',
    mri: 'On MRI, locate the expected lateral cricoarytenoid region between those cartilages; a separate muscle boundary may not be resolved.',
  },
  transverse: {
    landmark: 'Anatomical route: a transverse bridge across the posterior aspects of both arytenoids.',
    ct: 'On CT, use both arytenoids to locate the posterior interarytenoid interval across adjacent sections, without assuming a distinct muscle contour.',
    mri: 'On MRI, orient to the expected transverse bridge behind both arytenoids; routine individual-muscle visibility is not established here.',
  },
  oblique: {
    landmark: 'Anatomical route: one arytenoid muscular process toward the opposite arytenoid near its apex.',
    ct: 'On CT, use both arytenoids to orient the crossing interarytenoid region rather than tracing an individual fibre path.',
    mri: 'On MRI, consider the expected oblique route between opposite arytenoids; this atlas cannot establish a patient-specific fibre track.',
  },
} as const;
