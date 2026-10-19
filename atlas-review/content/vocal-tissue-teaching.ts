// Original educational prose; linked university tables and research do not license imported media.
export const vocalTissueTeachingReferences = {
  larynx: 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  deepNeck: 'https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html',
  uams: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-head-and-neck/',
  vocalisStudy: 'https://www.mdpi.com/1422-0067/25/22/11916',
} as const;

type Topic = {
  anatomy: string;
  function: string;
  prompt: string;
  limit: string;
  references: readonly string[];
};

/** Usual tissue relationships, repeated for separately pinned left and right selections. */
export const vocalTissueTeachingTopics = {
  ligament: {
    anatomy: 'The vocal ligament is an elastic connective-tissue band forming the thickened free superior edge of the conus elasticus. In usual anatomy it runs from the inner anterior thyroid cartilage to the vocal process of the same-side arytenoid. The selected ligament is one component within the true vocal fold, not the complete mucosal fold.',
    function: 'This passive connective element contributes to the fold’s mechanical support as laryngeal muscles change its position or length. It does not contract like vocalis. Its displayed surface cannot establish tissue tension, sound, or vibration.',
    prompt: 'Compare the selected ligament with the same-side vocalis and the thyroid and arytenoid cartilages. The conus elasticus and mucosal covering are not independently represented here.',
    limit: 'The mesh does not verify ligament attachment footprints, fibre architecture, histological layers, an airway dimension or a surgical plane.',
    references: [vocalTissueTeachingReferences.uams, vocalTissueTeachingReferences.deepNeck],
  },
  vocalis: {
    anatomy: 'Vocalis is skeletal muscle comprising the medial fibres of thyroarytenoid alongside the vocal ligament. In usual anatomy these fibres follow the thyroid-to-arytenoid region; a separate source name does not establish a complete independent muscle boundary or the complete mucosal fold.',
    function: 'Vocalis can actively make fine adjustments to vocal-fold tissue tension in concert with other laryngeal muscles. Its usual motor context is the inferior laryngeal branch of the recurrent laryngeal nerve from vagus (X). This static surface shows no contraction or measured voice effect.',
    prompt: 'Contrast this active medial thyroarytenoid muscle with the passive connective vocal ligament on the same side. The nerve and complete tissue layers are not independently modelled.',
    limit: 'The source cannot resolve a complete vocalis boundary, histological layers, nerve fibres, vocal-fold vibration, sound or a patient-specific functional effect.',
    references: [vocalTissueTeachingReferences.larynx, vocalTissueTeachingReferences.deepNeck, vocalTissueTeachingReferences.vocalisStudy],
  },
} as const satisfies Record<'ligament' | 'vocalis', Topic>;
