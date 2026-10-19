// Original cross-sectional orientation notes. Linked studies are factual references;
// no images, contours, measurements or treatment guidance are imported.
export const pharyngealConstrictorImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
  ct: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4243212/',
  mri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2787803/',
} as const;

export type PharyngealConstrictorGroup = 'superior' | 'inferior';
export type PharyngealConstrictorModality = 'ct' | 'mri';
type Reference = keyof typeof pharyngealConstrictorImagingReferences;
type Focus = { body: string; bullets: readonly string[]; references: readonly Reference[] };

export const pharyngealConstrictorImagingTopics: Record<
  PharyngealConstrictorGroup,
  Record<PharyngealConstrictorModality, Focus>
> = {
  superior: {
    ct: {
      body: 'On axial neck CT, orient the upper pharyngeal wall by the pterygoid hamulus and posterior mandible, then follow the wall beside the pharyngeal lumen on successive levels.',
      bullets: [
        'Compare its lateral course with the medial pterygoid region and its posterior relationship with prevertebral muscle; one slice cannot establish the whole constrictor.',
        'The hyoid helps mark the transition toward the middle pharyngeal level. The middle constrictor is not an independently admitted selection in this atlas.',
      ],
      references: ['anatomy', 'ct'],
    },
    mri: {
      body: 'On axial T1- and T2-weighted neck MRI, use the pterygoid level and pharyngeal lumen to orient the upper constrictor region, then compare neighbouring levels and planes.',
      bullets: [
        'Keep the thin pharyngeal wall separate from adjacent medial pterygoid and prevertebral muscles on the actual series.',
        'The source surface has no MR signal or validated patient-specific muscle boundary; the cited MRI study used acquisition-specific axial images to delineate constrictors.',
      ],
      references: ['anatomy', 'mri'],
    },
  },
  inferior: {
    ct: {
      body: 'On axial neck CT, follow the lower pharyngeal wall around the laryngeal region, using the thyroid and cricoid cartilages as successive anatomical landmarks.',
      bullets: [
        'Relate the wall to the pharyngeal lumen medially and prevertebral muscle posteriorly; check consecutive levels rather than assigning a muscle from one section.',
        'The hyoid-to-larynx transition helps separate lower from upper pharyngeal orientation. This selection does not independently delineate cricopharyngeus or an upper-oesophageal-sphincter boundary.',
      ],
      references: ['anatomy', 'ct'],
    },
    mri: {
      body: 'On axial T1- and T2-weighted neck MRI, use the thyroid-to-cricoid region to follow the lower constrictor beside the hypopharyngeal lumen across levels.',
      bullets: [
        'Compare the actual muscle-wall signal and neighbouring prevertebral tissues on the acquired images; the atlas colour is not an MR signal map.',
        'A fixed exterior surface cannot establish a separate cricopharyngeal segment, sphincter opening or swallowing motion.',
      ],
      references: ['anatomy', 'mri'],
    },
  },
};
