// Short original factual synthesis. No external illustrations, tables or scans.
export const glotticMuscleImagingReferences={
 anatomy:'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
 ct:'https://pubmed.ncbi.nlm.nih.gov/17535777/',
 mri:'https://pubmed.ncbi.nlm.nih.gov/2298998/',
} as const;
export const glotticMuscleImagingTopics={
 thyroarytenoid:{
  landmark:'Anatomical orientation: inner anterior thyroid cartilage toward the same-side arytenoid; the vocalis comprises medial fibres along the vocal ligament.',
  ct:'The thyroid cartilage and ipsilateral arytenoid frame the muscular true-fold region on CT. Review adjacent sections and surrounding paraglottic tissue rather than treating the atlas surface as an acquired muscle contour.',
  mri:'Use thyroid and arytenoid landmarks to orient the muscular true-fold region on MRI. Muscle contrast can be useful, but distinguishable contours depend on acquisition; separate atlas selections do not establish independent scan regions.',
 },
 vocalis:{
  landmark:'Anatomical orientation: medial thyroarytenoid fibres beside the vocal ligament, not a separate complete vocal fold or its mucosal cover.',
  ct:'Vocalis belongs to the medial thyroarytenoid region. Compare true-fold-level soft tissue on CT; do not infer an individually resolved vocalis boundary from this separate labelled surface.',
  mri:'Compare the muscular true-fold region in its thyroid-to-arytenoid orientation. MRI showing vocal-fold soft tissue does not necessarily distinguish vocalis from adjacent thyroarytenoid fibres; no patient-specific boundary is supplied here.',
 },
} as const;
